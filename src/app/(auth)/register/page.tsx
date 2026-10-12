"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, Loader2, CheckCircle2 } from "lucide-react";

export default function RequestAccessPage() {
  const [form, setForm] = useState({ name: "", email: "", firmName: "", phone: "", message: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!acceptTerms) { setError("Please accept the Terms of Service and DPA to continue."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/public/access-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, acceptedTerms: acceptTerms }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong. Please try again."); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--bg-base) 0%, #EDE9E0 100%)", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Scale style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginTop: "1rem" }}>Linoscore Legal</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Request access</p>
        </div>

        <div className="lf-card" style={{ padding: "2rem" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 style={{ width: 40, height: 40, color: "var(--success, #2e7d5b)", margin: "0 auto 0.75rem" }} />
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--navy)", fontSize: "1.1rem" }}>Request received</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.6 }}>
                Thanks, {form.name.split(" ")[0] || "there"}. We&apos;ll review your request and email <b>{form.email}</b> when your firm is approved — with a link to set your password and start your 14-day free trial.
              </p>
            </div>
          ) : (
            <>
              <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Tell us about your firm and we&apos;ll get you set up. New firms get a 14-day free trial — no credit card required.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {error && (
                  <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", fontWeight: 500 }}>{error}</div>
                )}
                <div>
                  <label htmlFor="name" className="lf-label">Full Name</label>
                  <input id="name" type="text" value={form.name} onChange={set("name")} className="lf-input" placeholder="Jane Smith" required />
                </div>
                <div>
                  <label htmlFor="email" className="lf-label">Work Email</label>
                  <input id="email" type="email" value={form.email} onChange={set("email")} className="lf-input" placeholder="you@lawfirm.com" required />
                </div>
                <div>
                  <label htmlFor="firmName" className="lf-label">Firm Name</label>
                  <input id="firmName" type="text" value={form.firmName} onChange={set("firmName")} className="lf-input" placeholder="Smith & Associates" required />
                </div>
                <div>
                  <label htmlFor="phone" className="lf-label">Phone <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                  <input id="phone" type="tel" value={form.phone} onChange={set("phone")} className="lf-input" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label htmlFor="message" className="lf-label">Anything we should know? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                  <textarea id="message" value={form.message} onChange={set("message")} className="lf-input" rows={3} placeholder="Practice area, firm size, what you're looking for…" style={{ resize: "vertical", fontFamily: "inherit" }} />
                </div>

                <label htmlFor="acceptTerms" style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, cursor: "pointer" }}>
                  <input id="acceptTerms" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} required style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: "var(--gold)" }} />
                  <span>
                    I agree to the{" "}
                    <Link href="/legal/terms" target="_blank" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Terms of Service</Link>,{" "}
                    <Link href="/legal/privacy" target="_blank" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>, and{" "}
                    <Link href="/legal/dpa" target="_blank" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Data Processing Addendum</Link>.
                  </span>
                </label>

                <button type="submit" disabled={loading || !acceptTerms} className="lf-btn lf-btn-gold" style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", opacity: loading || !acceptTerms ? 0.6 : 1 }}>
                  {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
                  Request access
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/" style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-muted)", textDecoration: "none" }}>&larr; Back to Linoscore Legal</Link>
        </p>
      </div>
    </div>
  );
}
