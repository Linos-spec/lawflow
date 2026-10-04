"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/v1/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show the same confirmation (no account enumeration).
      setSent(true);
    } catch {
      setSent(true);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--bg-base) 0%, #EDE9E0 100%)", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Scale style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginTop: "1rem" }}>Linoscore Legal</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Reset your password</p>
        </div>

        <div className="lf-card" style={{ padding: "2rem" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <MailCheck style={{ width: 40, height: 40, color: "var(--gold)", margin: "0 auto 0.75rem" }} />
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--navy)", fontSize: "1.05rem" }}>Check your email</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.6 }}>
                If an account exists for <b>{email}</b>, we&apos;ve sent a link to reset your password. It expires in one hour.
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                Didn&apos;t get it? Check spam, or{" "}
                <button type="button" onClick={() => setSent(false)} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontWeight: 600, padding: 0 }}>try again</button>.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Enter the email for your account and we&apos;ll send you a link to set a new password.
              </p>
              <div>
                <label htmlFor="email" className="lf-label">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="lf-input" placeholder="you@lawfirm.com" required autoFocus />
              </div>
              <button type="submit" disabled={loading || !email} className="lf-btn lf-btn-gold" style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", opacity: loading || !email ? 0.6 : 1 }}>
                {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
                Send reset link
              </button>
            </form>
          )}

          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
