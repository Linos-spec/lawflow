"use client";

import { useEffect, useState, useCallback } from "react";
import { Timer, Plus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Entry { id: string; description: string; hours: number; rate: number; amount: number; date: string; billable: boolean; billed: boolean; user: string }
interface Totals { totalHours: number; billableHours: number; billableAmount: number; unbilledAmount: number }

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function TimeEntries({ caseId, defaultRate }: { caseId: string; defaultRate?: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/time`);
      const j = await res.json();
      if (j.success) { setEntries(j.data.entries); setTotals(j.data.totals); }
    } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  const del = async (e: Entry) => {
    if (!confirm(`Delete this ${e.hours}h entry?`)) return;
    setBusyId(e.id);
    try {
      const res = await fetch(`/api/v1/time/${e.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) { toast.error(j.error || "Couldn't delete"); return; }
      await load();
    } finally { setBusyId(null); }
  };

  return (
    <div className="lf-card" id="time-section" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>
          <Timer style={{ width: 18, height: 18, color: "var(--gold)" }} /> Time &amp; fees
        </h3>
        <button onClick={() => setShowAdd(true)} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.85rem", fontSize: "0.83rem" }}>
          <Plus style={{ width: 15, height: 15 }} /> Record time
        </button>
      </div>

      {totals && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: "1rem" }}>
          <Stat label="Billable hours" value={`${totals.billableHours}`} />
          <Stat label="Billable value" value={money(totals.billableAmount)} />
          <Stat label="Unbilled" value={money(totals.unbilledAmount)} accent />
          <Stat label="Total hours" value={`${totals.totalHours}`} />
        </div>
      )}

      {loading ? (
        <div style={{ padding: "1.5rem", textAlign: "center" }}><Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
      ) : entries.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>No time logged yet. Record time to start tracking billable work on this matter.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {entries.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.55rem 0", borderTop: "1px solid var(--border-default)" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.85rem", color: "var(--navy)", fontWeight: 500 }}>{e.description}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {fmtDate(e.date)} · {e.user} · {e.hours}h @ {money(e.rate)}
                  {!e.billable && " · non-billable"}{e.billed && " · billed"}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: e.billable ? "var(--navy)" : "var(--text-muted)", fontSize: "0.9rem", whiteSpace: "nowrap" }}>{money(e.amount)}</div>
              {!e.billed && (
                <button onClick={() => del(e)} disabled={busyId === e.id} className="lf-btn lf-btn-ghost" style={{ padding: "0.25rem", color: "var(--danger)" }} aria-label="Delete entry">
                  {busyId === e.id ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <RecordTimeModal caseId={caseId} defaultRate={defaultRate} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ padding: "0.5rem 0.65rem", borderRadius: 8, background: "var(--bg-base)", borderLeft: accent ? "3px solid var(--gold)" : undefined }}>
      <div style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "var(--navy)", fontSize: "1.05rem" }}>{value}</div>
    </div>
  );
}

function RecordTimeModal({ caseId, defaultRate, onClose, onSaved }: { caseId: string; defaultRate?: number; onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState(defaultRate ? String(defaultRate) : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [billable, setBillable] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!description.trim()) { toast.error("Describe the work"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/time`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, hours: Number(hours), rate: Number(rate), date, billable }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) { toast.error(j.error || "Couldn't save time"); setSaving(false); return; }
      toast.success("Time recorded");
      onSaved();
    } finally { setSaving(false); }
  };

  const amount = (Number(hours) || 0) * (Number(rate) || 0);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,27,51,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} className="lf-card" style={{ width: "100%", maxWidth: 440, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Record time</h2>
          <X style={{ width: 20, height: 20, cursor: "pointer", color: "var(--text-muted)" }} onClick={onClose} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div><label className="lf-label">What did you work on?</label><textarea className="lf-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Drafted motion to dismiss" style={{ resize: "vertical" }} /></div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}><label className="lf-label">Hours</label><input className="lf-input" type="number" step="0.1" min="0" max="24" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="1.5" /></div>
            <div style={{ flex: 1 }}><label className="lf-label">Rate ($/hr)</label><input className="lf-input" type="number" step="1" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="250" /></div>
            <div style={{ flex: 1 }}><label className="lf-label">Date</label><input className="lf-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--gold)" }} /> Billable
          </label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Amount: <b style={{ color: "var(--navy)" }}>{money(amount)}</b></span>
            <button onClick={submit} disabled={saving} className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 1.1rem" }}>
              {saving && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
