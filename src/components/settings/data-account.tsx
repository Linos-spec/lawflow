"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useFirm } from "@/components/providers/firm-provider";
import { Download, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

/** Admin-only: portable data export + permanent account closure ("never locked in"). */
export function DataAccountCard() {
  const { firm } = useFirm();
  const firmName = firm?.name || "";
  const [showClose, setShowClose] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const closeAccount = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/firm/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
      const j = await res.json();
      if (!res.ok || !j.success) { toast.error(j.error || "Could not close the account"); return; }
      toast.success("Account closed. Signing you out…");
      await signOut({ callbackUrl: "/" });
    } finally { setBusy(false); }
  };

  return (
    <div className="lf-card">
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.25rem" }}>Data &amp; account</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Your data is yours. Export a full copy anytime — you&apos;re never locked in.
      </p>

      <a href="/api/v1/firm/export" className="lf-btn lf-btn-outline" style={{ padding: "0.55rem 1rem" }}>
        <Download style={{ width: 16, height: 16 }} /> Export all firm data (JSON)
      </a>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
        Includes clients, matters, deadlines, document records, billing, and users. Document file contents are metadata-only.
      </p>

      {/* Danger zone */}
      <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.4rem" }}>
          <AlertTriangle style={{ width: 15, height: 15 }} /> Danger zone
        </div>
        {!showClose ? (
          <button onClick={() => setShowClose(true)} className="lf-btn lf-btn-outline" style={{ padding: "0.5rem 0.9rem", color: "var(--danger)", borderColor: "var(--danger-bg)" }}>
            <Trash2 style={{ width: 15, height: 15 }} /> Close account
          </button>
        ) : (
          <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 10, padding: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#7f1d1d", lineHeight: 1.55 }}>
              This <b>permanently deletes</b> your firm and every client, matter, document, deadline, invoice, and user account. It cannot be undone. Export your data first.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--navy)", margin: "0.75rem 0 0.4rem" }}>
              Type <b>{firmName || "your firm name"}</b> to confirm:
            </p>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={firmName} className="lf-input" style={{ maxWidth: 320 }} />
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button onClick={closeAccount} disabled={busy || !firmName || confirm.trim() !== firmName} className="lf-btn" style={{ padding: "0.5rem 0.9rem", background: "var(--danger)", color: "#fff", opacity: (busy || confirm.trim() !== firmName) ? 0.55 : 1 }}>
                {busy ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                Permanently close account
              </button>
              <button onClick={() => { setShowClose(false); setConfirm(""); }} className="lf-btn lf-btn-ghost" style={{ padding: "0.5rem 0.9rem" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
