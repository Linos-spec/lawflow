"use client";

import { useEffect, useState, useCallback } from "react";
import { MonitorSmartphone, Copy, Loader2, ExternalLink, Lock, CalendarClock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PortalMessages } from "./portal-messages";

export function CasePortal({ caseId }: { caseId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [pinSet, setPinSet] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [pinInput, setPinInput] = useState("");
  const [expiryInput, setExpiryInput] = useState("");
  const [savingAccess, setSavingAccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal`);
      const json = await res.json();
      if (json.success) {
        setEnabled(json.data.portalEnabled);
        setUrl(json.data.portalUrl);
        setPinSet(json.data.pinSet);
        setExpiresAt(json.data.expiresAt);
        setExpiryInput(json.data.expiresAt ? json.data.expiresAt.slice(0, 10) : "");
      }
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

  const patchAccess = async (payload: { pin?: string | null; expiresAt?: string | null }, okMsg: string) => {
    setSavingAccess(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Couldn't update access"); return; }
      setPinSet(json.data.pinSet);
      setExpiresAt(json.data.expiresAt);
      setExpiryInput(json.data.expiresAt ? json.data.expiresAt.slice(0, 10) : "");
      setPinInput("");
      toast.success(okMsg);
    } finally { setSavingAccess(false); }
  };

  if (loading) return null;

  const inputStyle: React.CSSProperties = { padding: "0.45rem 0.55rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.82rem", background: "var(--bg-base)", color: "var(--navy)" };

  return (
    <div className="lf-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>
        <MonitorSmartphone style={{ width: 17, height: 17, color: "var(--gold)" }} /> Client Portal
      </h3>
      {!enabled ? (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Give your client a secure, mobile-friendly link to track progress, view documents, message you, and see their balance — no login required.</p>
          <button onClick={enable} disabled={busy} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem" }}>
            {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <MonitorSmartphone style={{ width: 16, height: 16 }} />} Enable portal
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input readOnly value={url || ""} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 200, padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.82rem", fontFamily: "var(--font-mono, monospace)", color: "var(--text-secondary)", background: "var(--bg-base)" }} />
            <button onClick={copy} className="lf-btn" style={{ padding: "0.5rem 0.7rem", background: "var(--bg-base)", color: "var(--navy)" }} aria-label="Copy link"><Copy style={{ width: 15, height: 15 }} /></button>
            {url && <a href={url} target="_blank" rel="noreferrer" className="lf-btn" style={{ padding: "0.5rem 0.7rem", background: "var(--bg-base)", color: "var(--navy)" }} aria-label="Open portal"><ExternalLink style={{ width: 15, height: 15 }} /></a>}
          </div>

          {/* Access & security */}
          <div style={{ marginTop: "1rem", padding: "0.85rem", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-base)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.6rem" }}>
              <ShieldCheck style={{ width: 13, height: 13 }} /> Access & security
            </div>

            {/* PIN */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <Lock style={{ width: 14, height: 14, color: pinSet ? "var(--success)" : "var(--text-muted)" }} />
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: 96 }}>PIN {pinSet ? <b style={{ color: "var(--success)" }}>on</b> : "off"}</span>
              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder={pinSet ? "Enter new PIN" : "4–8 digits"}
                inputMode="numeric"
                style={{ ...inputStyle, width: 120 }}
                aria-label="Portal access PIN"
              />
              <button onClick={() => patchAccess({ pin: pinInput }, "PIN updated")} disabled={savingAccess || pinInput.length < 4} className="lf-btn lf-btn-outline" style={{ padding: "0.4rem 0.7rem" }}>Set PIN</button>
              {pinSet && <button onClick={() => patchAccess({ pin: "" }, "PIN removed")} disabled={savingAccess} className="lf-btn lf-btn-ghost" style={{ padding: "0.4rem 0.6rem", color: "var(--danger)" }}>Remove</button>}
            </div>

            {/* Expiry */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <CalendarClock style={{ width: 14, height: 14, color: expiresAt ? "var(--warning)" : "var(--text-muted)" }} />
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: 96 }}>
                {expiresAt ? <>Expires <b style={{ color: "var(--warning)" }}>{expiresAt.slice(0, 10)}</b></> : "No expiry"}
              </span>
              <input type="date" value={expiryInput} onChange={(e) => setExpiryInput(e.target.value)} style={{ ...inputStyle }} aria-label="Portal link expiry date" />
              <button onClick={() => patchAccess({ expiresAt: expiryInput || null }, expiryInput ? "Expiry set" : "Expiry cleared")} disabled={savingAccess} className="lf-btn lf-btn-outline" style={{ padding: "0.4rem 0.7rem" }}>Save</button>
              {expiresAt && <button onClick={() => patchAccess({ expiresAt: null }, "Expiry cleared")} disabled={savingAccess} className="lf-btn lf-btn-ghost" style={{ padding: "0.4rem 0.6rem", color: "var(--danger)" }}>Clear</button>}
            </div>
          </div>

          {/* Messaging */}
          <PortalMessages caseId={caseId} />

          <button onClick={disable} disabled={busy} style={{ marginTop: "0.85rem", background: "none", border: "none", color: "var(--danger)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>Turn off portal</button>
        </>
      )}
    </div>
  );
}
