"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CreditCard, Users, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Sub {
  configured: boolean;
  status: string;
  hasSubscription: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  seats: number;
  pricePerSeat: number;
  monthlyTotal: number;
  isAdmin: boolean;
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function BillingPanel() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/subscription");
      const j = await res.json();
      if (j.success) setSub(j.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Reflect the return from Stripe Checkout.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("billing");
    if (p === "success") { toast.success("Subscription started — thank you!"); window.history.replaceState({}, "", "/settings"); }
    else if (p === "cancel") { toast("Checkout canceled."); window.history.replaceState({}, "", "/settings"); }
  }, []);

  const go = async (kind: "checkout" | "portal") => {
    setBusy(kind);
    try {
      const res = await fetch(`/api/v1/subscription/${kind}`, { method: "POST" });
      const j = await res.json();
      if (j.data?.notConfigured) { toast.error("Billing isn't set up yet."); return; }
      if (!res.ok || !j.success || !j.data?.url) { toast.error(j.data?.error || j.error || "Something went wrong."); return; }
      window.location.href = j.data.url;
    } finally { setBusy(null); }
  };

  if (loading) return <div className="lf-card" style={{ padding: "2rem", textAlign: "center" }}><Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>;
  if (!sub) return null;

  const active = sub.status === "active";
  const trialing = sub.status === "trialing";
  const pastDue = sub.status === "past_due";
  const needsPlan = ["trial_expired", "none", "canceled"].includes(sub.status);

  const statusChip = () => {
    if (active) return <span className="lf-badge lf-badge-green"><CheckCircle2 style={{ width: 13, height: 13 }} /> Active</span>;
    if (trialing) return <span className="lf-badge" style={{ background: "var(--info-bg, #e7f0fb)", color: "var(--info, #2b6cb0)" }}>Free trial</span>;
    if (pastDue) return <span className="lf-badge lf-badge-warning">Payment due</span>;
    return <span className="lf-badge lf-badge-gray">No active plan</span>;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Plan summary */}
      <div className="lf-card" style={{ borderLeft: "4px solid var(--gold)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Plan</p>
              {statusChip()}
            </div>
            <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              Linoscore Legal — {money(sub.pricePerSeat)}/user/mo
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Users style={{ width: 15, height: 15 }} />
              {sub.seats} {sub.seats === 1 ? "seat" : "seats"} · <b style={{ color: "var(--navy)" }}>{money(sub.monthlyTotal)}/mo</b>
            </p>
            {trialing && sub.trialDaysLeft != null && (
              <p className="text-sm mt-1" style={{ color: "var(--info, #2b6cb0)" }}>
                {sub.trialDaysLeft} day{sub.trialDaysLeft === 1 ? "" : "s"} left in your free trial{sub.trialEndsAt ? ` (ends ${new Date(sub.trialEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })})` : ""}.
              </p>
            )}
          </div>

          {sub.isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
              {(active || pastDue || sub.hasSubscription) ? (
                <button onClick={() => go("portal")} disabled={busy !== null} className="lf-btn lf-btn-outline">
                  {busy === "portal" ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <ExternalLink style={{ width: 15, height: 15 }} />}
                  Manage billing
                </button>
              ) : (
                <button onClick={() => go("checkout")} disabled={busy !== null} className="lf-btn lf-btn-gold">
                  {busy === "checkout" ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <CreditCard style={{ width: 15, height: 15 }} />}
                  {trialing ? "Add payment method" : "Subscribe"}
                </button>
              )}
            </div>
          )}
        </div>

        {pastDue && (
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 8, background: "var(--warning-bg)", color: "#92400e", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle style={{ width: 15, height: 15 }} /> Your last payment failed. Update your card to keep access.
          </div>
        )}
        {needsPlan && (
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 8, background: "var(--bg-base)", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {sub.status === "trial_expired" ? "Your free trial has ended." : "No active subscription."} {sub.isAdmin ? "Subscribe to keep your firm running on Linoscore Legal." : "Ask your firm admin to set up billing."}
          </div>
        )}
      </div>

      {/* Not-configured note (admin only) */}
      {!sub.configured && sub.isAdmin && (
        <div className="lf-card" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <p style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>Billing isn&apos;t connected yet</p>
          Seat tracking is live ({sub.seats} × {money(sub.pricePerSeat)} = <b>{money(sub.monthlyTotal)}/mo</b>), but card payments aren&apos;t enabled on this deployment yet. Once Stripe keys are added, the Subscribe and Manage-billing buttons here go live automatically — no other change needed.
        </div>
      )}

      {/* How seats work */}
      <div className="lf-card">
        <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)", marginBottom: "0.5rem" }}>How billing works</h3>
        <ul style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "1.1rem" }}>
          <li>You pay <b>{money(sub.pricePerSeat)} per user, per month</b>. Your current total is <b>{money(sub.monthlyTotal)}/mo</b> for {sub.seats} {sub.seats === 1 ? "seat" : "seats"}.</li>
          <li>Add or remove team members in <b>Team &amp; Roles</b> — your bill adjusts automatically, prorated.</li>
          <li>Every plan starts with a <b>14-day free trial</b>. Cancel anytime from Manage billing.</li>
        </ul>
      </div>
    </div>
  );
}
