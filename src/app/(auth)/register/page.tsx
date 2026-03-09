"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firmName, setFirmName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, firmName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--bg-base) 0%, #EDE9E0 100%)",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--navy)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scale style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--navy)",
              marginTop: "1rem",
            }}
          >
            LawFlow
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            Start your free trial
          </p>
        </div>

        {/* Card */}
        <div
          className="lf-card"
          style={{ padding: "2rem" }}
        >
          {/* Trial note */}
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
            }}
          >
            14 days free. No credit card required.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Error */}
            {error && (
              <div
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="lf-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="lf-input"
                placeholder="John Smith"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="lf-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lf-input"
                placeholder="you@lawfirm.com"
                required
              />
            </div>

            {/* Firm Name */}
            <div>
              <label htmlFor="firmName" className="lf-label">
                Firm Name
              </label>
              <input
                id="firmName"
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="lf-input"
                placeholder="Smith & Associates"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="lf-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lf-input"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="lf-btn lf-btn-gold"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                fontSize: "0.9375rem",
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? "none" : "auto",
              }}
            >
              {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
              Create Account
            </button>
          </form>

          {/* Login link */}
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: "1.5rem",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--gold)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back link */}
        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            &larr; Back to LawFlow.app
          </Link>
        </p>
      </div>
    </div>
  );
}
