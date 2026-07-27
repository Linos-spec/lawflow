"use client";

import { useState } from "react";
import { Truck, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useFirm } from "@/components/providers/firm-provider";

export function DeliveryConnectionCard({ isAdmin }: { isAdmin: boolean }) {
  const { firm, refresh } = useFirm();
  const connected = !!firm?.deliveryConnected;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "",
    line1: firm?.deliveryPickupLine1 || "", line2: firm?.deliveryPickupLine2 || "",
    city: firm?.deliveryPickupCity || "", state: firm?.deliveryPickupState || "", postalCode: firm?.deliveryPickupPostal || "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const connect = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/firm/delivery-connection", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, pickup: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, postalCode: form.postalCode } }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Could not connect"); return; }
      toast.success("Linoscore Delivery connected");
      await refresh();
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await fetch("/api/v1/firm/delivery-connection", { method: "DELETE" });
      toast.success("Disconnected");
      await refresh();
    } finally { setBusy(false); }
  };

  const inputStyle: React.CSSProperties = { padding: "0.55rem 0.7rem", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-card)", fontSize: "0.88rem", width: "100%" };

  return (
    <div className="lf-card" style={{ padding: "1.75rem", maxWidth: 640 }}>
      <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Truck style={{ width: 22, height: 22, color: "#fff" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>Linoscore Delivery</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
            Connect your firm&apos;s Linoscore Delivery account to file and deliver documents straight from a matter — with court-stamped proof returned to the case.
          </p>
        </div>
      </div>

      {connected ? (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.9rem 1.1rem", borderRadius: 12, background: "var(--success-bg)", color: "var(--success)", fontWeight: 600, fontSize: "0.9rem" }}>
            <CheckCircle2 style={{ width: 18, height: 18 }} /> Connected as {firm?.deliveryApiEmail}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
            Pickup: {[firm?.deliveryPickupLine1, firm?.deliveryPickupCity, firm?.deliveryPickupState, firm?.deliveryPickupPostal].filter(Boolean).join(", ") || "—"}
          </div>
          {isAdmin && <button onClick={disconnect} disabled={busy} className="lf-btn" style={{ marginTop: "1rem", padding: "0.5rem 0.9rem", background: "var(--danger-bg)", color: "var(--danger)" }}>Disconnect</button>}
        </div>
      ) : !isAdmin ? (
        <p className="text-sm" style={{ color: "var(--text-muted)", marginTop: "1.1rem" }}>Not connected. Ask a firm admin to set up Linoscore Delivery.</p>
      ) : (
        <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input style={inputStyle} placeholder="Delivery account email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <input style={inputStyle} type="password" placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginTop: "0.3rem" }}>Firm pickup address</div>
          <input style={inputStyle} placeholder="Street address" value={form.line1} onChange={(e) => set("line1", e.target.value)} />
          <input style={inputStyle} placeholder="Suite / floor (optional)" value={form.line2} onChange={(e) => set("line2", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.6rem" }}>
            <input style={inputStyle} placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
            <input style={inputStyle} placeholder="State" value={form.state} onChange={(e) => set("state", e.target.value)} />
            <input style={inputStyle} placeholder="ZIP" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
          </div>
          <button onClick={connect} disabled={busy || !form.email || !form.password || !form.line1} className="lf-btn lf-btn-gold" style={{ marginTop: "0.5rem", padding: "0.6rem 1rem", alignSelf: "flex-start", opacity: busy ? 0.6 : 1 }}>
            {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Truck style={{ width: 16, height: 16 }} />} Connect &amp; verify
          </button>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>We verify the login with Linoscore Delivery before saving. Credentials are used only to reach the courier API on your behalf.</p>
        </div>
      )}
    </div>
  );
}
