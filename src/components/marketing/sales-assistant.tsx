"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }
type Chip = { label: string; prompt?: string; reply?: string; next?: Chip[]; intro?: string; back?: boolean; link?: string; href?: string; primary?: boolean };

const GREETING: Msg = {
  role: "assistant",
  content: "Hi there! I'm Wilson, the Linoscore Legal AI assistant. 👋\n\nWhether you're exploring Linoscore Legal or already a customer, I can point you in the right direction — pick an option below, or just ask me anything.",
};

// Customer (existing-firm) support branch
const SUPPORT_MENU: Chip[] = [
  { label: "Billing & account", reply: "For your plan, invoices, or seats: sign in and open Settings → Plan & Billing. Need a hand with billing? Email support@linoscore.com and we'll help." },
  { label: "Technical / IT support", reply: "Sorry you're hitting a snag. Email support@linoscore.com with a short description (a screenshot helps) and our team will help you sort it out. If it's urgent, mention that in the subject." },
  { label: "Training & how-to", reply: "Happy to help you get the most out of Linoscore Legal. Email support@linoscore.com to set up a walkthrough — or just ask me a how-to question right here." },
  { label: "← Back", back: true },
];

// Prospect / exploring branch
const EXPLORE_MENU: Chip[] = [
  { label: "What can the AI do?", prompt: "What can Linoscore Legal's AI actually do for my firm?" },
  { label: "See pricing", prompt: "How much does Linoscore Legal cost?" },
  { label: "Speak to a sales representative", reply: "I'd be glad to connect you. Email sales@linoscore.com to book a discovery call — a rep usually replies within one business day. Prefer to try it first? Start a free 14-day trial, no credit card required." },
  { label: "Start free trial", link: "/register", primary: true },
  { label: "← Back", back: true },
];

const ROOT_MENU: Chip[] = [
  { label: "I'm a customer (billing, IT & training)", next: SUPPORT_MENU, intro: "Happy to help — what do you need a hand with?" },
  { label: "I'm exploring Linoscore Legal", next: EXPLORE_MENU, intro: "Great — what would you like to know?" },
  { label: "Speak to a sales representative", reply: "I'd be glad to connect you. Email sales@linoscore.com to book a discovery call — a rep usually replies within one business day. Or start a free 14-day trial (no credit card) to explore on your own." },
];

export function SalesAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [menu, setMenu] = useState<Chip[]>(ROOT_MENU);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy, open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/public/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const j = await res.json().catch(() => ({}));
      setMessages((m) => [...m, { role: "assistant", content: j.reply || "Sorry, could you try again?" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I hit a snag. Email sales@linoscore.com or start a free trial." }]);
    } finally { setBusy(false); }
  };

  const clickChip = (c: Chip) => {
    if (c.back) { setMenu(ROOT_MENU); return; }
    if (c.next) {
      setMessages((m) => [...m, { role: "user", content: c.label }, ...(c.intro ? [{ role: "assistant" as const, content: c.intro }] : [])]);
      setMenu(c.next);
      return;
    }
    if (c.reply) { setMessages((m) => [...m, { role: "user", content: c.label }, { role: "assistant", content: c.reply! }]); return; }
    if (c.prompt) { send(c.prompt); return; }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} aria-label="Chat with Wilson, the Linoscore Legal assistant" className="lf-sales-fab">
        <Bot style={{ width: 22, height: 22 }} />
        <span className="lf-sales-fab-label">Ask Wilson</span>
      </button>
    );
  }

  return (
    <div className="lf-sales-panel" role="dialog" aria-label="Linoscore Legal assistant">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.9rem 1rem", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>Wilson</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} aria-hidden /> Online · Linoscore Legal AI assistant
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="lf-icon-btn"><X style={{ width: 18, height: 18 }} /></button>
      </div>

      {/* Thread */}
      <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
            <div style={{
              padding: "0.55rem 0.75rem", borderRadius: 14, fontSize: "0.9rem", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
              background: m.role === "user" ? "var(--navy)" : "var(--bg-base)",
              color: m.role === "user" ? "#fff" : "var(--navy)",
              border: m.role === "user" ? "none" : "1px solid var(--border-default)",
            }}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: "flex-start", padding: "0.55rem 0.75rem", borderRadius: 14, background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
            <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />
          </div>
        )}
      </div>

      {/* Router chips (persistent) */}
      {!busy && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 0.9rem 0.6rem" }}>
          {menu.map((c) => {
            const style = c.primary ? { background: "var(--gold)", color: "#422006", borderColor: "var(--gold)", fontWeight: 700 } : undefined;
            if (c.link) return <Link key={c.label} href={c.link} className="lf-sales-chip" style={style}>{c.primary && <Sparkles style={{ width: 12, height: 12 }} />}{c.label}</Link>;
            if (c.href) return <a key={c.label} href={c.href} className="lf-sales-chip" style={style}>{c.label}</a>;
            return <button key={c.label} onClick={() => clickChip(c)} className="lf-sales-chip" style={style}>{c.label}</button>;
          })}
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ display: "flex", gap: 8, padding: "0.75rem 0.9rem", borderTop: "1px solid var(--border-light)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" aria-label="Ask a question"
          style={{ flex: 1, padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid var(--border-default)", fontSize: "0.9rem", background: "var(--bg-base)", color: "var(--navy)" }} />
        <button type="submit" disabled={busy || !input.trim()} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 0.7rem" }} aria-label="Send">
          <Send style={{ width: 16, height: 16 }} />
        </button>
      </form>

      <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", padding: "0 0.9rem 0.75rem", lineHeight: 1.4 }}>
        Chats may be recorded by Linos LLC and its service providers. Don&apos;t share confidential client details here.{" "}
        <Link href="/legal/privacy" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>Privacy Policy</Link>
      </p>
    </div>
  );
}
