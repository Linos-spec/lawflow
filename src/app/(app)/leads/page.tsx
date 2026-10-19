"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Copy, Check, X, Sparkles, Download, Mail, Link2, Clock } from "lucide-react";
import { toast } from "sonner";
import { CASE_TYPE_LABELS } from "@/lib/constants";
import { conflictBadge, SOURCE_LABELS, STAGE_LABELS } from "@/lib/lead-badges";
import { IntakeInbox } from "@/components/intake/intake-inbox";
import { LeadsAiPanel } from "@/components/leads/leads-ai-panel";

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  stage: string;
  caseType: string;
  description: string | null;
  qualificationScore: number | null;
  aiPriority: string | null;
  aiSummary: string | null;
  aiNextSteps: string[];
  retainerRationale: string | null;
  importantDates: string | null;
  conflictStatus: string;
  createdAt: string;
  adverseParties: string[];
  assignedTo: { name: string } | null;
}

// Filter tabs group the raw LeadStage enum into the firm-facing funnel.
const STAGE_TABS: { key: string; label: string; stages: string[] | null }[] = [
  { key: "all", label: "All", stages: null },
  { key: "new", label: "New", stages: ["NEW"] },
  { key: "qualifying", label: "Qualifying", stages: ["QUALIFYING", "QUALIFIED"] },
  { key: "consult", label: "Consult booked", stages: ["CONSULT_SCHEDULED"] },
  { key: "engaged", label: "Engagement sent", stages: ["ENGAGED"] },
  { key: "retained", label: "Retained", stages: ["CONVERTED"] },
  { key: "lost", label: "Lost", stages: ["LOST", "DISQUALIFIED"] },
];

const STAGE_NEXT: Record<string, string> = {
  NEW: "Send acknowledgement", QUALIFYING: "Continue qualifying", QUALIFIED: "Book a consult",
  CONSULT_SCHEDULED: "Prepare for consult", ENGAGED: "Awaiting signature", CONVERTED: "Retained",
  DISQUALIFIED: "—", LOST: "—",
};
const PRIORITY_LABELS: Record<string, string> = { URGENT: "Urgent", HIGH: "High priority", MEDIUM: "Medium", LOW: "Low" };

const scoreColor = (s: number) => (s >= 75 ? "#2e7d5b" : s >= 50 ? "#b7791f" : "#b42318");

function fmtReceived(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yd = new Date(today.getTime() - 86_400_000);
  if (sameDay) return `Today ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (d.toDateString() === yd.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nextStepFor(l: LeadRow): string {
  if (l.conflictStatus === "POTENTIAL" || l.conflictStatus === "CONFLICT") return "Review conflict first";
  if (l.aiNextSteps && l.aiNextSteps[0]) return l.aiNextSteps[0];
  return STAGE_NEXT[l.stage] || "—";
}
function whyFor(l: LeadRow): string {
  if (l.qualificationScore == null) return "Scoring in progress";
  return (l.retainerRationale || (l.aiPriority ? PRIORITY_LABELS[l.aiPriority] || "" : "") || "").slice(0, 80);
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [intakeLink, setIntakeLink] = useState<string | null>(null);
  const [intakeEmail, setIntakeEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [copied, setCopied] = useState<"link" | "email" | null>(null);
  const [tab, setTab] = useState("all");
  const [chip, setChip] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setShowAdd(true);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/leads?limit=100");
      const json = await res.json();
      if (json.success) { setLeads(json.data); setIntakeLink(json.intakeLink); setIntakeEmail(json.intakeEmail); }
    } catch { toast.error("Failed to load leads"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const copy = (text: string | null, which: "link" | "email") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(which);
    toast.success(which === "link" ? "Intake link copied" : "Intake email copied");
    setTimeout(() => setCopied(null), 1800);
  };

  // ── Portfolio stats ──
  const stats = useMemo(() => {
    const open = leads.filter((l) => !["LOST", "DISQUALIFIED", "CONVERTED"].includes(l.stage));
    const scored = open.filter((l) => l.qualificationScore != null);
    const avg = scored.length ? Math.round(scored.reduce((s, l) => s + (l.qualificationScore || 0), 0) / scored.length) : 0;
    const needResp = leads.filter((l) => l.stage === "NEW");
    const oldest = needResp.reduce<number | null>((m, l) => {
      const age = Date.now() - new Date(l.createdAt).getTime();
      return m == null || age > m ? age : m;
    }, null);
    return {
      needFirstResponse: needResp.length,
      oldestWaiting: oldest != null ? humanAge(oldest) : null,
      conflictsToReview: leads.filter((l) => ["POTENTIAL", "CONFLICT"].includes(l.conflictStatus)).length,
      consultsScheduled: leads.filter((l) => l.stage === "CONSULT_SCHEDULED").length,
      avgScore: avg,
    };
  }, [leads]);

  const tabCounts = useMemo(() => {
    const m: Record<string, number> = { all: leads.length };
    for (const t of STAGE_TABS) if (t.stages) m[t.key] = leads.filter((l) => t.stages!.includes(l.stage)).length;
    return m;
  }, [leads]);

  const filtered = useMemo(() => {
    const t = STAGE_TABS.find((x) => x.key === tab);
    return leads.filter((l) => {
      if (t?.stages && !t.stages.includes(l.stage)) return false;
      if (chip === "needs" && l.stage !== "NEW") return false;
      if (chip === "conflict" && !["POTENTIAL", "CONFLICT"].includes(l.conflictStatus)) return false;
      if (chip === "consult" && l.stage !== "CONSULT_SCHEDULED") return false;
      if (chip === "retained" && l.stage !== "CONVERTED") return false;
      if (q) {
        const hay = `${l.name} ${l.email ?? ""} ${CASE_TYPE_LABELS[l.caseType] ?? ""} ${(l.adverseParties || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, tab, chip, q]);

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "Source", "Matter", "AI score", "Conflict", "Stage", "Owner", "Received"]];
    for (const l of filtered) rows.push([
      l.name, l.email || "", l.phone || "", SOURCE_LABELS[l.source] || l.source, CASE_TYPE_LABELS[l.caseType] || l.caseType,
      l.qualificationScore != null ? String(l.qualificationScore) : "", conflictBadge(l.conflictStatus).label,
      STAGE_LABELS[l.stage] || l.stage, l.assignedTo?.name || "Unassigned", new Date(l.createdAt).toISOString().slice(0, 10),
    ]);
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleChip = (c: string) => setChip((p) => (p === c ? null : c));

  return (
    <div style={{ padding: "1.75rem", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 800, color: "var(--navy)" }}>Leads</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.2rem", fontSize: "0.9rem" }}>Inbound prospects, conflict-checked and AI-qualified on arrival.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowAi(true)} className="lf-btn" style={{ padding: "0.55rem 0.9rem", background: "var(--navy)", color: "#fff" }}>
            <Sparkles style={{ width: 16, height: 16 }} /> Ask Linoscore AI
          </button>
          <button onClick={exportCsv} className="lf-btn lf-btn-outline" style={{ padding: "0.55rem 0.9rem" }}>
            <Download style={{ width: 16, height: 16 }} /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 1rem" }}>
            <Plus style={{ width: 16, height: 16 }} /> Add lead
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <Tile label="Need first response" value={String(stats.needFirstResponse)} sub={stats.oldestWaiting ? `Oldest waiting ${stats.oldestWaiting}` : "All caught up"} onClick={() => { setChip("needs"); setTab("all"); }} />
        <Tile label="Conflicts to review" value={String(stats.conflictsToReview)} sub="Block intake until cleared" danger={stats.conflictsToReview > 0} onClick={() => { setChip("conflict"); setTab("all"); }} />
        <Tile label="Consults scheduled" value={String(stats.consultsScheduled)} sub="On the calendar" onClick={() => { setChip("consult"); setTab("all"); }} />
        <Tile label="Average AI score" value={String(stats.avgScore)} sub="Across scored open leads" />
      </div>

      {/* Intake channels */}
      {intakeLink && (
        <div className="lf-card" style={{ padding: "0.7rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Intake channels</span>
          <button onClick={() => copy(intakeLink, "link")} style={chanBtn} title="Copy intake link">
            <Link2 style={{ width: 14, height: 14, color: "var(--gold)" }} /> {intakeLink.replace(/^https?:\/\//, "")} {copied === "link" ? <Check style={{ width: 13, height: 13, color: "var(--success,#2e7d5b)" }} /> : <Copy style={{ width: 13, height: 13, opacity: 0.5 }} />}
          </button>
          {intakeEmail && (
            <button onClick={() => copy(intakeEmail, "email")} style={chanBtn} title="Copy intake inbox address">
              <Mail style={{ width: 14, height: 14, color: "var(--gold)" }} /> {intakeEmail} {copied === "email" ? <Check style={{ width: 13, height: 13, color: "var(--success,#2e7d5b)" }} /> : <Copy style={{ width: 13, height: 13, opacity: 0.5 }} />}
            </button>
          )}
          <button onClick={() => setShowInbox((s) => !s)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--gold)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
            {showInbox ? "Hide" : "Log an email"}
          </button>
        </div>
      )}
      {showInbox && <IntakeInbox address={intakeEmail} onLogged={() => { setShowInbox(false); load(); }} />}

      {/* Tabs + search */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
          {STAGE_TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "0.35rem 0.7rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
              background: tab === t.key ? "var(--navy)" : "transparent", color: tab === t.key ? "#fff" : "var(--text-secondary)",
            }}>
              {t.label} <span style={{ opacity: 0.6, fontWeight: 500 }}>{tabCounts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <input className="lf-input" style={{ maxWidth: 280, minWidth: 180 }} placeholder="Name, email, matter, opposing party" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* Quick chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: "0.85rem", flexWrap: "wrap" }}>
        {[["needs", "Needs first response"], ["conflict", "Conflict flagged"], ["consult", "Consult scheduled"], ["retained", "Retained"]].map(([k, label]) => (
          <button key={k} onClick={() => toggleChip(k)} style={{
            padding: "0.25rem 0.65rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
            border: `1px solid ${chip === k ? "var(--gold)" : "var(--border-default)"}`,
            background: chip === k ? "var(--gold)" : "transparent", color: chip === k ? "#fff" : "var(--text-secondary)",
          }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
      ) : leads.length === 0 ? (
        <div className="lf-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>No leads yet. Share your intake link or add one manually to get started.</div>
      ) : (
        <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "var(--bg-base)", color: "var(--text-muted)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Th>Lead / Contact</Th><Th>Matter / AI summary</Th><Th>Source / Received</Th><Th>AI score / Why</Th><Th>Conflict</Th><Th>Stage / Next step</Th><Th>Owner / Key date</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const cb = conflictBadge(l.conflictStatus);
                  const flagged = ["POTENTIAL", "CONFLICT"].includes(l.conflictStatus);
                  const tint = flagged ? "var(--warning-bg, #fdf3e3)" : l.stage === "CONVERTED" ? "var(--success-bg, #ecf7f1)" : undefined;
                  return (
                    <tr key={l.id} onClick={() => router.push(`/leads/${l.id}`)} style={{ borderTop: "1px solid var(--border-default)", cursor: "pointer", background: tint }}>
                      <Td>
                        <div style={{ fontWeight: 700, color: "var(--navy)" }}>{l.name}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{l.email || "—"}</div>
                        {l.phone && <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{l.phone}</div>}
                      </Td>
                      <Td style={{ maxWidth: 230 }}>
                        <span className="lf-badge" style={{ background: "rgba(15,27,51,0.06)", color: "var(--navy)", fontSize: "0.68rem" }}>{CASE_TYPE_LABELS[l.caseType] || l.caseType}</span>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {l.aiSummary || l.description || "—"}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ color: "var(--navy)", fontWeight: 600 }}>{SOURCE_LABELS[l.source] || l.source}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{fmtReceived(l.createdAt)}</div>
                      </Td>
                      <Td style={{ minWidth: 130 }}>
                        {l.qualificationScore != null ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 800, color: scoreColor(l.qualificationScore) }}>{l.qualificationScore}</span>
                              <span style={{ flex: 1, height: 5, borderRadius: 3, background: "var(--border-default)", maxWidth: 70, overflow: "hidden" }}>
                                <span style={{ display: "block", height: "100%", width: `${l.qualificationScore}%`, background: scoreColor(l.qualificationScore) }} />
                              </span>
                            </div>
                            <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 2 }}>{whyFor(l)}</div>
                          </>
                        ) : <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontStyle: "italic" }}>Scoring in progress</span>}
                      </Td>
                      <Td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: cb.bg, color: cb.text, borderRadius: 999, padding: "0.15rem 0.55rem", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                          <cb.Icon style={{ width: 12, height: 12 }} /> {l.conflictStatus === "POTENTIAL" ? "Potential match" : l.conflictStatus === "PENDING" ? "Not run" : cb.label}
                        </span>
                      </Td>
                      <Td>
                        <div style={{ fontWeight: 600, color: "var(--navy)" }}>{STAGE_LABELS[l.stage] || l.stage}</div>
                        <div style={{ fontSize: "0.74rem", color: flagged ? "var(--warning,#b7791f)" : "var(--text-muted)" }}>{nextStepFor(l)}</div>
                      </Td>
                      <Td>
                        <div style={{ color: l.assignedTo ? "var(--navy)" : "var(--text-muted)", fontWeight: l.assignedTo ? 600 : 400 }}>{l.assignedTo?.name || "Unassigned"}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{l.importantDates || "None"}</div>
                      </Td>
                      <Td style={{ textAlign: "right" }}>
                        <span style={{ color: "var(--gold)", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>Open →</span>
                      </Td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No leads match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>Showing {filtered.length} of {leads.length} leads</p>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
      <LeadsAiPanel open={showAi} onClose={() => setShowAi(false)} />
    </div>
  );
}

const chanBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono, monospace)" };
const Th = ({ children }: { children?: React.ReactNode }) => <th style={{ padding: "0.6rem 0.8rem", fontWeight: 700 }}>{children}</th>;
const Td = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <td style={{ padding: "0.7rem 0.8rem", verticalAlign: "top", ...style }}>{children}</td>;

function humanAge(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d`;
}

function Tile({ label, value, sub, onClick, danger }: { label: string; value: string; sub?: string; onClick?: () => void; danger?: boolean }) {
  return (
    <div className="lf-card" onClick={onClick} style={{ padding: "0.85rem 1rem", cursor: onClick ? "pointer" : "default", borderLeft: danger ? "3px solid var(--danger)" : undefined }}>
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 800, color: danger && value !== "0" ? "var(--danger)" : "var(--navy)", lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
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
