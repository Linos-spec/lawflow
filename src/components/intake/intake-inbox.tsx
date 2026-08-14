"use client";

import { useState } from "react";
import { Mail, Copy, Check, Loader2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

/**
 * Intake Inbox — surfaces the firm's unique intake email address and lets staff
 * log an emailed inquiry by pasting it in. Both the published address (via the
 * inbound webhook) and the paste form create a conflict-checked, AI-qualified
 * intake through the same pipeline.
 */
export function IntakeInbox({ address, onLogged }: { address: string | null; onLogged?: (leadId: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Intake address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async () => {
    if (!from.trim() && !body.trim()) {
      toast.error("Add the sender or paste the message");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/intake/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, subject, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Couldn't log the email");
        return;
      }
      toast.success("Intake created — conflict-checked and AI-qualified");
      setFrom(""); setSubject(""); setBody(""); setOpen(false);
      onLogged?.(json.data.leadId);
    } catch {
      toast.error("Couldn't reach the server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lf-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Mail style={{ width: 18, height: 18, color: "var(--gold)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>
            Intake inbox
          </div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.9rem", color: "var(--navy)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
            {address || "—"}
          </div>
        </div>
        {address && (
          <button onClick={copy} className="lf-btn lf-btn-outline" style={{ padding: "0.4rem 0.75rem", flexShrink: 0 }}>
            {copied ? <Check style={{ width: 15, height: 15 }} /> : <Copy style={{ width: 15, height: 15 }} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        <button onClick={() => setOpen((o) => !o)} className="lf-btn lf-btn-ghost" style={{ padding: "0.4rem 0.75rem", flexShrink: 0 }}>
          Log an email {open ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
        </button>
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.6rem", marginBottom: 0 }}>
        Publish this address or forward your <code>info@</code> inbox to it — inbound emails become conflict-checked, AI-qualified intakes.
        Every sender is treated as a prospective client (Rule 1.18): an acknowledgment makes clear no attorney–client relationship forms until a written engagement is signed.
      </p>

      {open && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "grid", gap: "0.6rem" }}>
          <input
            className="lf-input"
            placeholder='From — e.g. "Jane Doe <jane@example.com>"'
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            className="lf-input"
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="lf-input"
            placeholder="Paste the email body…"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={submit} disabled={busy} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem" }}>
              {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <ShieldCheck style={{ width: 16, height: 16 }} />}
              Create intake
            </button>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Runs conflict check + AI qualification.</span>
          </div>
        </div>
      )}
    </div>
  );
}
