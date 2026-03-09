"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scale, Loader2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
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
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          className="lf-card"
          style={{ padding: "2rem" }}
        >
          {/* Registration success */}
          {registered && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--success-bg)",
                color: "var(--success)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                marginBottom: "1.25rem",
              }}
            >
              <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} />
              Account created! Please sign in.
            </div>
          )}

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
                placeholder="Enter your password"
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
              Sign In
            </button>
          </form>

          {/* Register link */}
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: "1.5rem",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--gold)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Start free trial
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
