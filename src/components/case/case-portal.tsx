"use client";

import { useEffect, useState, useCallback } from "react";
import { MonitorSmartphone, Copy, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function CasePortal({ caseId }: { caseId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal`);
      const json = await res.json();
      if (json.success) { setEnabled(json.data.portalEnabled); setUrl(json.data.portalUrl); }
    } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  const enable = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed"); return; }
      setEnabled(true); setUrl(json.data.portalUrl);
      try { await navigator.clipboard.writeText(json.data.portalUrl); } catch {}
      toast.success("Client portal enabled — link copied");
    } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await fetch(`/api/v1/cases/${caseId}/portal`, { method: "DELETE" });
      setEnabled(false);
      toast.success("Client portal turned off");
    } finally { setBusy(false); }
  };

  const copy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch { toast.error("Copy failed"); }
  };

  if (loading) return null;

  return (
    <div className="lf-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>
        <MonitorSmartphone style={{ width: 17, height: 17, color: "var(--gold)" }} /> Client Portal
      </h3>
      {!enabled ? (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Give your client a secure, mobile-friendly link to track progress, view documents, and see their balance — no login required.</p>
          <button onClick={enable} disabled={busy} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem" }}>
            {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <MonitorSmartphone style={{ width: 16, height: 16 }} />} Enable portal
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input readOnly value={url || ""} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 200, padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.82rem", fontFamily: "var(--font-mono, monospace)", color: "var(--text-secondary)", background: "var(--bg-base)" }} />
            <button onClick={copy} className="lf-btn" style={{ padding: "0.5rem 0.7rem", background: "var(--bg-base)", color: "var(--navy)" }}><Copy style={{ width: 15, height: 15 }} /></button>
            {url && <a href={url} target="_blank" rel="noreferrer" className="lf-btn" style={{ padding: "0.5rem 0.7rem", background: "var(--bg-base)", color: "var(--navy)" }}><ExternalLink style={{ width: 15, height: 15 }} /></a>}
          </div>
          <button onClick={disable} disabled={busy} style={{ marginTop: "0.75rem", background: "none", border: "none", color: "var(--danger)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>Turn off portal</button>
        </>
      )}
    </div>
  );
}
