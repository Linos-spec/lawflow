"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, Loader2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

interface Msg { id: string; fromClient: boolean; authorName?: string | null; body: string; createdAt: string }

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Firm-side portal message thread for a matter (client ⇄ firm). */
export function PortalMessages({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal/messages`);
      const json = await res.json();
      if (json.success) setMessages(json.data.messages);
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
