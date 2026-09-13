"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, Loader2, MessagesSquare, CalendarPlus, CalendarCheck, CalendarClock } from "lucide-react";
import { toast } from "sonner";

interface MeetingProposal { title?: string; startsAt?: string; durationMins?: number; note?: string }
interface Msg {
  id: string; fromClient: boolean; authorName?: string | null; body: string; createdAt: string;
  meetingProposal?: MeetingProposal | null; meetingScheduled?: boolean;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const fmtMeeting = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Tag a Calendly link with the matter id so a booking maps back to this matter.
function withMatterTracking(url: string, caseId: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_content", caseId);
    u.searchParams.set("utm_source", "linoscore-portal");
    return u.toString();
  } catch { return url; }
}

/** Firm-side portal message thread for a matter (client ⇄ firm). */
export function PortalMessages({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal/messages`);
      const json = await res.json();
      if (json.success) { setMessages(json.data.messages); setCalendlyUrl(json.data.calendlyUrl ?? null); }
    } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: body }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Couldn't send"); return; }
      setMessages((m) => [...m, json.data.message]);
      setText("");
    } finally { setSending(false); }
  };

  const addToCalendar = async (m: Msg) => {
    setScheduling(m.id);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal/messages/${m.id}/schedule`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Couldn't add to calendar"); return; }
      toast.success(`Added to calendar — ${fmtMeeting(json.data.deadline.dueDate)}`);
      setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, meetingScheduled: true, meetingProposal: null } : x));
    } finally { setScheduling(null); }
  };

  // Reply into the thread with the firm's Calendly link so the client self-books.
  const sendBookingLink = async (m: Msg) => {
    if (!calendlyUrl) return;
    setScheduling(m.id);
    try {
      const body = `You can pick a time that works for you here: ${withMatterTracking(calendlyUrl, caseId)}`;
      const res = await fetch(`/api/v1/cases/${caseId}/portal/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: body }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Couldn't send the link"); return; }
      setMessages((prev) => [...prev, json.data.message]);
      toast.success("Booking link sent to your client");
    } finally { setScheduling(null); }
  };

  return (
    <div style={{ marginTop: "1rem", padding: "0.85rem", borderRadius: 10, border: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.6rem" }}>
        <MessagesSquare style={{ width: 13, height: 13 }} /> Client messages
      </div>

      <div ref={scrollRef} style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.6rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "1rem" }}><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", color: "var(--text-muted)" }} /></div>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center", padding: "0.75rem" }}>No messages yet. Say hello — your client sees these in their portal.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ alignSelf: m.fromClient ? "flex-start" : "flex-end", maxWidth: "82%" }}>
              <div style={{
                padding: "0.5rem 0.7rem", borderRadius: 12, fontSize: "0.85rem", lineHeight: 1.4,
                background: m.fromClient ? "var(--bg-base)" : "var(--navy)",
                color: m.fromClient ? "var(--navy)" : "#fff",
                border: m.fromClient ? "1px solid var(--border-default)" : "none",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>{m.body}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2, textAlign: m.fromClient ? "left" : "right" }}>
                {m.fromClient ? "Client" : (m.authorName || "You")} · {fmt(m.createdAt)}
              </div>

              {/* AI meeting suggestion — attorney reviews & confirms; never auto-booked. */}
              {m.fromClient && m.meetingProposal?.startsAt && !m.meetingScheduled && (
                <div style={{ marginTop: 6, padding: "0.55rem 0.65rem", borderRadius: 10, background: "var(--warning-bg, #fdf6e3)", border: "1px solid var(--gold)", maxWidth: 320 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 700, color: "var(--navy)" }}>
                    <CalendarPlus style={{ width: 13, height: 13, color: "var(--gold)" }} /> Meeting request detected
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--navy)", fontWeight: 600, marginTop: 3 }}>
                    {m.meetingProposal.title || "Client meeting"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {fmtMeeting(m.meetingProposal.startsAt)}{m.meetingProposal.durationMins ? ` · ${m.meetingProposal.durationMins} min` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {calendlyUrl && (
                      <button
                        onClick={() => sendBookingLink(m)}
                        disabled={scheduling === m.id}
                        className="lf-btn lf-btn-gold"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
                      >
                        {scheduling === m.id ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <CalendarClock style={{ width: 13, height: 13 }} />}
                        Send booking link
                      </button>
                    )}
                    <button
                      onClick={() => addToCalendar(m)}
                      disabled={scheduling === m.id}
                      className={calendlyUrl ? "lf-btn lf-btn-outline" : "lf-btn lf-btn-gold"}
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
                    >
                      {scheduling === m.id ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <CalendarPlus style={{ width: 13, height: 13 }} />}
                      Add to calendar
                    </button>
                  </div>
                  <p style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: 5, lineHeight: 1.4 }}>
                    {calendlyUrl
                      ? "Send booking link lets the client self-book via Calendly. Add to calendar books it directly (does not notify the client). Review before confirming."
                      : "AI suggestion — review before confirming. Add a Calendly link in Settings → Firm Details to let clients self-book instead."}
                  </p>
                </div>
              )}
              {m.fromClient && m.meetingScheduled && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--success, #2e7d5b)", fontWeight: 600 }}>
                  <CalendarCheck style={{ width: 13, height: 13 }} /> Added to calendar
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
          placeholder="Reply to your client…"
          rows={2}
          style={{ flex: 1, padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit", background: "var(--bg-base)", color: "var(--navy)" }}
        />
        <button onClick={send} disabled={sending || !text.trim()} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 0.8rem" }} aria-label="Send message">
          {sending ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 16, height: 16 }} />}
        </button>
      </div>
    </div>
  );
}
