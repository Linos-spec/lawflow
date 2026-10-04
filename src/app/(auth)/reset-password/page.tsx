"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Those passwords don't match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || "Couldn't reset your password."); setLoading(false); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--bg-base) 0%, #EDE9E0 100%)", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Scale style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginTop: "1rem" }}>Linoscore Legal</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Choose a new password</p>
        </div>

        <div className="lf-card" style={{ padding: "2rem" }}>
          {!token ? (
            <p style={{ fontSize: "0.9rem", color: "var(--danger)", textAlign: "center" }}>
              This reset link is missing its token. Please{" "}
              <Link href="/forgot-password" style={{ color: "var(--gold)", fontWeight: 600 }}>request a new one</Link>.
            </p>
          ) : done ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 style={{ width: 40, height: 40, color: "var(--success, #2e7d5b)", margin: "0 auto 0.75rem" }} />
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--navy)", fontSize: "1.05rem" }}>Password updated</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>Taking you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", fontWeight: 500 }}>{error}</div>
              )}
              <div>
                <label htmlFor="password" className="lf-label">New password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="lf-input" placeholder="At least 8 characters" minLength={8} required autoFocus />
              </div>
              <div>
                <label htmlFor="confirm" className="lf-label">Confirm new password</label>
                <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="lf-input" placeholder="Re-enter your password" minLength={8} required />
              </div>
              <button type="submit" disabled={loading} className="lf-btn lf-btn-gold" style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", opacity: loading ? 0.6 : 1 }}>
                {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
                Set new password
              </button>
            </form>
          )}

          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
            <Link href="/login" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
