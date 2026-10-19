"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Who needs a first response today?",
  "Which conflicts should I clear first?",
  "Draft call-prep notes for my highest-scored new lead",
  "Summarize this week's new leads",
];

/** Leads-scoped AI assistant — answers grounded in the firm's current leads. */
export function LeadsAiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/v1/leads/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const j = await res.json().catch(() => ({}));
      const reply = j?.data?.reply || "Sorry, I couldn't answer that right now.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I hit a snag. Please try again." }]);
    } finally { setSending(false); }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,27,51,0.35)", zIndex: 60 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100vw)", background: "var(--bg-card, #fff)", zIndex: 61, display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid var(--border-default)", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles style={{ width: 18, height: 18, color: "var(--gold)" }} />
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.98rem" }}>Ask Linoscore AI</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>Grounded in your current leads</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}><X style={{ width: 20, height: 20 }} /></button>
        </div>

        {/* Thread */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {messages.length === 0 ? (
            <div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Ask about your leads — who to call first, which conflicts to clear, or ask me to draft call notes or an acknowledgement email.
              </p>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", margin: "1rem 0 0.5rem" }}>Start with one of these</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} style={{ textAlign: "left", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-base)", color: "var(--navy)", fontSize: "0.82rem", cursor: "pointer" }}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
                <div style={{
                  padding: "0.6rem 0.8rem", borderRadius: 12, fontSize: "0.85rem", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  background: m.role === "user" ? "var(--navy)" : "var(--bg-base)",
                  color: m.role === "user" ? "#fff" : "var(--navy)",
                  border: m.role === "user" ? "none" : "1px solid var(--border-default)",
                }}>{m.content}</div>
              </div>
            ))
          )}
          {sending && (
            <div style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.82rem" }}>
              <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> Thinking…
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border-default)", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={2}
            placeholder="Ask about your leads…"
            style={{ flex: 1, padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.85rem", resize: "none", fontFamily: "inherit", background: "var(--bg-base)", color: "var(--navy)" }}
          />
          <button onClick={() => send(input)} disabled={sending || !input.trim()} className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 0.8rem" }} aria-label="Send">
            {sending ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 16, height: 16 }} />}
          </button>
        </div>
        <p style={{ fontSize: "0.66rem", color: "var(--text-muted)", textAlign: "center", padding: "0 1rem 0.6rem" }}>
          Decision-support only — drafts are for attorney review, not legal advice.
        </p>
      </div>
    </>
  );
}
