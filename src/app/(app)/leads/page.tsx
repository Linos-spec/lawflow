"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Copy, Check, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { CASE_TYPE_LABELS } from "@/lib/constants";
import { conflictBadge, SOURCE_LABELS, STAGE_LABELS } from "@/lib/lead-badges";

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  stage: string;
  caseType: string;
  qualificationScore: number | null;
  conflictStatus: string;
  createdAt: string;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [intakeLink, setIntakeLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Deep link from "New intake" (AI Intake page) opens the add form directly.
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      setShowAdd(true);
    }
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/leads?limit=100");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
        setIntakeLink(json.intakeLink);
      }
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const copyLink = () => {
    if (!intakeLink) return;
    navigator.clipboard.writeText(intakeLink);
    setCopied(true);
    toast.success("Intake link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)" }}>Leads</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Inbound prospects, auto conflict-checked and AI-qualified.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="lf-btn lf-btn-gold" style={{ padding: "0.625rem 1.25rem" }}>
          <Plus style={{ width: 18, height: 18 }} /> Add lead
        </button>
      </div>

      {/* Shareable intake link */}
      {intakeLink && (
        <div className="lf-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link2 style={{ width: 18, height: 18, color: "var(--gold)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Your public intake link — share on your website, Google listing, or with callers</p>
            <p style={{ fontSize: "0.875rem", color: "var(--navy)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{intakeLink}</p>
          </div>
          <button onClick={copyLink} className="lf-btn" style={{ padding: "0.5rem 0.875rem", background: "var(--bg-base)", color: "var(--navy)", flexShrink: 0 }}>
            {copied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} />
        </div>
      ) : leads.length === 0 ? (
        <div className="lf-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
          No leads yet. Share your intake link or add one manually to get started.
        </div>
      ) : (
        <div className="lf-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border, #e5e0d5)", textAlign: "left" }}>
                {["Name", "Source", "Matter", "Score", "Conflict", "Stage"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const cb = conflictBadge(l.conflictStatus);
                return (
                  <tr key={l.id} onClick={() => router.push(`/leads/${l.id}`)} style={{ borderBottom: "1px solid var(--border, #f0ece3)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--navy)" }}>{l.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{l.email || l.phone || "—"}</div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{SOURCE_LABELS[l.source] || l.source}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{CASE_TYPE_LABELS[l.caseType] || l.caseType}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      {l.qualificationScore != null ? (
                        <span style={{ fontWeight: 700, color: l.qualificationScore >= 70 ? "var(--success, #2e7d5b)" : l.qualificationScore >= 40 ? "var(--warning, #b7791f)" : "var(--text-secondary)" }}>{l.qualificationScore}</span>
                      ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: cb.bg, color: cb.text, borderRadius: 999, padding: "0.2rem 0.625rem", fontSize: "0.75rem", fontWeight: 600 }}>
                        <cb.Icon style={{ width: 13, height: 13 }} /> {cb.label}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{STAGE_LABELS[l.stage] || l.stage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("PHONE");
  const [caseType, setCaseType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [adverse, setAdverse] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, email, source, caseType, description,
          adverseParties: adverse.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to add lead"); setSaving(false); return; }
      toast.success("Lead added — conflict check run");
      onCreated();
    } catch {
      toast.error("Failed to add lead");
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,27,51,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} className="lf-card" style={{ width: "100%", maxWidth: 480, padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)" }}>Add lead</h2>
          <X style={{ width: 20, height: 20, cursor: "pointer", color: "var(--text-muted)" }} onClick={onClose} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div><label className="lf-label">Name *</label><input className="lf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Caller's name" /></div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}><label className="lf-label">Phone</label><input className="lf-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div style={{ flex: 1 }}><label className="lf-label">Email</label><input className="lf-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label className="lf-label">Source</label>
              <select className="lf-input" value={source} onChange={(e) => setSource(e.target.value)}>
                {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="lf-label">Matter</label>
              <select className="lf-input" value={caseType} onChange={(e) => setCaseType(e.target.value)}>
                {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div><label className="lf-label">What do they need?</label><textarea className="lf-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: "vertical" }} /></div>
          <div><label className="lf-label">Opposing parties (comma-separated)</label><input className="lf-input" value={adverse} onChange={(e) => setAdverse(e.target.value)} placeholder="Acme Corp, John Smith" /></div>
          <button onClick={submit} disabled={saving} className="lf-btn lf-btn-gold" style={{ padding: "0.75rem", marginTop: "0.25rem", opacity: saving ? 0.6 : 1 }}>
            {saving && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />} Add &amp; run conflict check
          </button>
        </div>
      </div>
    </div>
  );
}
