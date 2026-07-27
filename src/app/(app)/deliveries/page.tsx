"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Truck, RefreshCw, FileCheck2, ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner";
import { useFirm } from "@/components/providers/firm-provider";

interface Delivery {
  id: string; externalId: string; trackingNumber: string | null; status: string;
  serviceLevel: string | null; recipientName: string | null; reference: string | null;
  isCourtFiling: boolean; dropoffSummary: string | null; proofDocumentId: string | null;
  lastSyncedAt: string | null; createdAt: string;
  case: { id: string; caseNumber: string; title: string } | null;
}

function statusTone(status: string): { bg: string; c: string } {
  const s = status.toLowerCase();
  if (/delivered|filed|completed/.test(s)) return { bg: "var(--success-bg)", c: "var(--success)" };
  if (/transit|pickedup|picked|assigned/.test(s)) return { bg: "var(--info-bg, #eff6ff)", c: "var(--info, #2563eb)" };
  if (/cancel|fail/.test(s)) return { bg: "var(--danger-bg)", c: "var(--danger)" };
  return { bg: "var(--warning-bg)", c: "var(--warning)" };
}

export default function DeliveriesPage() {
  const { firm } = useFirm();
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/deliveries");
      const json = await res.json();
      if (json.success) setRows(json.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const refresh = async (id: string) => {
    setRefreshing(id);
    try {
      const res = await fetch(`/api/v1/deliveries/${id}/refresh`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Refresh failed"); return; }
      toast.success(`Status: ${json.data.status}`);
      await load();
    } finally { setRefreshing(null); }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Truck style={{ width: 26, height: 26, color: "var(--gold)" }} /> Delivery
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Court filings &amp; document delivery via Linoscore Delivery — with court-stamped proof back on the matter.</p>
        </div>
      </div>

      {firm && !firm.deliveryConnected && (
        <div className="lf-card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: "var(--gold-bg, #faf6ec)", borderLeft: "3px solid var(--gold)" }}>
          <div style={{ fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Connect Linoscore Delivery to get started</div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Add your firm&apos;s Linoscore Delivery account and pickup address in Settings, then send filings straight from any matter.</div>
          <Link href="/settings" className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem", textDecoration: "none" }}><Settings style={{ width: 16, height: 16 }} /> Open Settings</Link>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
      ) : rows.length === 0 ? (
        <div className="lf-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
          No deliveries yet. Open a matter and choose <b>Send via Linoscore Delivery</b>.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {rows.map((d) => {
            const tone = statusTone(d.status);
            return (
              <div key={d.id} className="lf-card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Truck style={{ width: 20, height: 20, color: "var(--gold)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--navy)" }}>{d.recipientName || "Delivery"}</span>
                    {d.isCourtFiling && <span style={{ fontSize: "0.68rem", fontWeight: 600, background: "var(--brand-soft, #eaf0fe)", color: "var(--brand, #1d4ed8)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>Court filing</span>}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    {d.trackingNumber || d.externalId.slice(0, 8)}{d.dropoffSummary ? ` · ${d.dropoffSummary}` : ""}
                  </div>
                  {d.case && <Link href={`/cases/${d.case.id}`} style={{ fontSize: "0.78rem", color: "var(--brand, #1d4ed8)", textDecoration: "none" }}>{d.case.caseNumber} — {d.case.title}</Link>}
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: tone.bg, color: tone.c, padding: "0.2rem 0.7rem", borderRadius: 999 }}>{d.status}</span>
                {d.proofDocumentId && (
                  <Link href={`/documents/${d.proofDocumentId}`} title="Proof of delivery" style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem", textDecoration: "none" }}>
                    <FileCheck2 style={{ width: 16, height: 16 }} /> Proof
                  </Link>
                )}
                <button onClick={() => refresh(d.id)} disabled={refreshing === d.id} className="lf-btn" style={{ padding: "0.4rem 0.7rem", background: "var(--bg-base)", color: "var(--navy)" }} title="Refresh status">
                  <RefreshCw style={{ width: 15, height: 15, animation: refreshing === d.id ? "spin 1s linear infinite" : "none" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", display: "flex", alignItems: "center", gap: 4 }}>
        <ExternalLink style={{ width: 12, height: 12 }} /> Powered by Linoscore Delivery · legaldelivery.linoscore.com
      </p>
    </div>
  );
}
