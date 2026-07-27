"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Truck, Loader2, RefreshCw, FileCheck2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useFirm } from "@/components/providers/firm-provider";

interface Delivery {
  id: string; externalId: string; trackingNumber: string | null; status: string;
  recipientName: string | null; isCourtFiling: boolean; dropoffSummary: string | null;
  proofDocumentId: string | null; createdAt: string;
}

function tone(status: string) {
  const s = status.toLowerCase();
  if (/delivered|filed|completed/.test(s)) return { bg: "var(--success-bg)", c: "var(--success)" };
  if (/transit|picked|assigned/.test(s)) return { bg: "var(--info-bg, #eff6ff)", c: "var(--info, #2563eb)" };
  if (/cancel|fail/.test(s)) return { bg: "var(--danger-bg)", c: "var(--danger)" };
  return { bg: "var(--warning-bg)", c: "var(--warning)" };
}

const input: React.CSSProperties = { padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-card)", fontSize: "0.86rem", width: "100%" };

export function CaseDeliveries({ caseId }: { caseId: string }) {
  const { firm } = useFirm();
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [f, setF] = useState({ recipientName: "", line1: "", line2: "", city: "", state: "", postalCode: "", serviceLevel: "Routine", priority: "Standard", isCourtFiling: true, dropoffSummary: "" });
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/deliveries`);
      const json = await res.json();
      if (json.success) setRows(json.data);
    } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/deliveries`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: f.recipientName,
          dropoff: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, postalCode: f.postalCode },
          serviceLevel: f.serviceLevel, priority: f.priority, isCourtFiling: f.isCourtFiling,
          dropoffSummary: f.dropoffSummary || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to create delivery"); return; }
      toast.success(`Delivery created — ${json.data.trackingNumber || "tracking pending"}`);
      setOpen(false);
      setF({ recipientName: "", line1: "", line2: "", city: "", state: "", postalCode: "", serviceLevel: "Routine", priority: "Standard", isCourtFiling: true, dropoffSummary: "" });
      await load();
    } finally { setBusy(false); }
  };

  const refresh = async (id: string) => {
    setRefreshing(id);
    try {
      const res = await fetch(`/api/v1/deliveries/${id}/refresh`, { method: "POST" });
      const json = await res.json();
      if (res.ok) { toast.success(`Status: ${json.data.status}`); await load(); }
      else toast.error(json.error || "Refresh failed");
    } finally { setRefreshing(null); }
  };

  return (
    <div className="lf-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>
          <Truck style={{ width: 18, height: 18, color: "var(--gold)" }} /> Delivery &amp; Filing
        </h3>
        {firm?.deliveryConnected && !open && (
          <button onClick={() => setOpen(true)} className="lf-btn lf-btn-gold" style={{ padding: "0.4rem 0.8rem" }}><Plus style={{ width: 15, height: 15 }} /> Send</button>
        )}
      </div>

      {!firm?.deliveryConnected ? (
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Connect Linoscore Delivery in <Link href="/settings" style={{ color: "var(--brand, #1d4ed8)" }}>Settings</Link> to file and deliver documents from this matter.
        </p>
      ) : (
        <>
          {open && (
            <div style={{ border: "1px solid var(--border-light)", borderRadius: 12, padding: "1rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--navy)" }}>Send via Linoscore Delivery</span>
                <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: 16, height: 16 }} /></button>
              </div>
              <input style={input} placeholder="Recipient / court name" value={f.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
              <input style={input} placeholder="Destination street address" value={f.line1} onChange={(e) => set("line1", e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.5rem" }}>
                <input style={input} placeholder="City" value={f.city} onChange={(e) => set("city", e.target.value)} />
                <input style={input} placeholder="State" value={f.state} onChange={(e) => set("state", e.target.value)} />
                <input style={input} placeholder="ZIP" value={f.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <select style={input} value={f.serviceLevel} onChange={(e) => set("serviceLevel", e.target.value)}>
                  <option value="Routine">Routine</option><option value="Priority">Priority</option><option value="Emergency">Emergency</option>
                </select>
                <select style={input} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
                  <option value="Standard">Standard</option><option value="Expedited">Expedited</option><option value="Rush">Rush</option><option value="SameDay">Same-day</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={f.isCourtFiling} onChange={(e) => set("isCourtFiling", e.target.checked)} /> This is a court filing
              </label>
              <button onClick={submit} disabled={busy || !f.recipientName || !f.line1 || !f.city || !f.state || !f.postalCode} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 1rem", alignSelf: "flex-start", opacity: busy ? 0.6 : 1 }}>
                {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Truck style={{ width: 16, height: 16 }} />} Create delivery
              </button>
            </div>
          )}

          {loading ? (
            <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", color: "var(--gold)" }} />
          ) : rows.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No deliveries for this matter yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {rows.map((d) => {
                const t = tone(d.status);
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.7rem", borderRadius: 8, background: "var(--bg-base)", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--navy)" }}>{d.recipientName || "Delivery"}{d.isCourtFiling ? " · filing" : ""}</div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>{d.trackingNumber || d.externalId.slice(0, 10)}</div>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, background: t.bg, color: t.c, padding: "0.15rem 0.6rem", borderRadius: 999 }}>{d.status}</span>
                    {d.proofDocumentId && <Link href={`/documents/${d.proofDocumentId}`} title="Court-stamped proof" style={{ color: "var(--success)", display: "inline-flex" }}><FileCheck2 style={{ width: 16, height: 16 }} /></Link>}
                    <button onClick={() => refresh(d.id)} disabled={refreshing === d.id} title="Refresh status" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "inline-flex" }}>
                      <RefreshCw style={{ width: 15, height: 15, animation: refreshing === d.id ? "spin 1s linear infinite" : "none" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
