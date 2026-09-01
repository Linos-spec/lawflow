"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { KeyRound, LogOut } from "lucide-react";
import { TwoFactorEnroll } from "@/components/settings/two-factor";

/**
 * Enforces the firm's "require 2FA" policy: if the firm requires MFA and the
 * signed-in user hasn't enrolled, this overlays the app with a mandatory setup
 * flow. Users who already have 2FA, or firms that don't require it, pass through.
 */
export function MfaGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ mfaEnabled: boolean; firmRequired: boolean } | null>(null);
  const [checked, setChecked] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/mfa");
      const j = await res.json();
      if (j.success) setState(j.data);
    } finally { setChecked(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const mustEnroll = checked && state && state.firmRequired && !state.mfaEnabled;
  if (!mustEnroll) return <>{children}</>;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", overflowY: "auto" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 18, boxShadow: "0 20px 60px rgba(15,27,51,0.35)", maxWidth: 480, width: "100%", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--navy)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <KeyRound style={{ width: 24, height: 24, color: "var(--gold-light)" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>Set up two-factor authentication</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Your firm requires 2FA to continue.</p>
          </div>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <TwoFactorEnroll onDone={() => load()} />
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="lf-btn lf-btn-ghost" style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
          <LogOut style={{ width: 15, height: 15 }} /> Sign out
        </button>
      </div>
    </div>
  );
}
