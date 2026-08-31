"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, Lock, CreditCard, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Sub {
  locked: boolean; status: string; isAdmin: boolean; hasSubscription: boolean;
  seats: number; pricePerSeat: number; monthlyTotal: number; configured: boolean;
}

/**
 * Hard paywall. When the firm's trial has lapsed with no active subscription,
 * this overlays the entire app and only lets the admin subscribe (or anyone sign
 * out). Grandfathered/trialing/active firms pass straight through. Server routes
 * enforce the same rule (entitledOr402), so this is the UX half of the gate.
 */
export function BillingGate({ children }: { children: React.ReactNode }) {
  const [sub, setSub] = useState<Sub | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/subscription")
      .then((r) => r.json())
      .then((j) => { if (active && j.success) setSub(j.data); })
      .catch(() => {})
      .finally(() => { if (active) setChecked(true); });
    return () => { active = false; };
  }, []);

  const go = async (kind: "checkout" | "portal") => {
    setBusy(kind);
    try {
      const res = await fetch(`/api/v1/subscription/${kind}`, { method: "POST" });
      const j = await res.json();
      if (j.data?.notConfigured) { toast.error("Billing isn't set up yet — contact support."); return; }
      if (!j.data?.url) { toast.error(j.data?.error || "Something went wrong."); return; }
      window.location.href = j.data.url;
    } finally { setBusy(null); }
  };

  // Until we know, and whenever unlocked, render the app normally.
  if (!checked || !sub || !sub.locked) return <>{children}</>;

  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  const trialEnded = sub.status === "trial_expired";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 18, boxShadow: "0 20px 60px rgba(15,27,51,0.35)", maxWidth: 460, width: "100%", padding: "2.25rem", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--navy)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <Lock style={{ width: 30, height: 30, color: "var(--gold-light)" }} />
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>
          {trialEnded ? "Your free trial has ended" : "Subscription inactive"}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0.6rem 0 1.25rem" }}>
          {sub.isAdmin
            ? <>Subscribe to keep your firm running on Linoscore Legal — your matters, clients, and documents are safe and waiting.</>
            : <>Your firm&apos;s subscription is inactive. Please ask your firm admin to reactivate billing to restore access.</>}
        </p>

        {sub.isAdmin && (
          <div style={{ background: "var(--bg-base)", borderRadius: 12, padding: "0.85rem 1rem", marginBottom: "1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            <b style={{ color: "var(--navy)" }}>{money(sub.monthlyTotal)}/mo</b> — {sub.seats} {sub.seats === 1 ? "seat" : "seats"} × {money(sub.pricePerSeat)}/user
          </div>
        )}

        {sub.isAdmin && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sub.hasSubscription ? (
              <button onClick={() => go("portal")} disabled={busy !== null} className="lf-btn lf-btn-gold" style={{ justifyContent: "center", padding: "0.75rem 1rem" }}>
                {busy === "portal" ? <Loader2 style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }} /> : <CreditCard style={{ width: 17, height: 17 }} />}
                Update billing
              </button>
            ) : (
              <button onClick={() => go("checkout")} disabled={busy !== null} className="lf-btn lf-btn-gold" style={{ justifyContent: "center", padding: "0.75rem 1rem" }}>
                {busy === "checkout" ? <Loader2 style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }} /> : <CreditCard style={{ width: 17, height: 17 }} />}
                Subscribe — {money(sub.monthlyTotal)}/mo
              </button>
            )}
          </div>
        )}

        <button onClick={() => signOut({ callbackUrl: "/login" })} className="lf-btn lf-btn-ghost" style={{ justifyContent: "center", width: "100%", marginTop: "0.75rem", color: "var(--text-muted)" }}>
          <LogOut style={{ width: 15, height: 15 }} /> Sign out
        </button>
      </div>
    </div>
  );
}
