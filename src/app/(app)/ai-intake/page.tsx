"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Loader2, Sparkles, ShieldAlert, ShieldCheck, ShieldQuestion,
  CalendarClock, AlertTriangle, ArrowRight, Inbox, ClipboardList, UserCircle2, FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import { CASE_TYPE_LABELS } from "@/lib/constants";
import {
  INTAKE_STATUS_LABELS, INTAKE_STATUS_COLORS, type IntakeStatus,
} from "@/lib/intake";

interface QueueItem {
  id: string; name: string; caseType: string; intakeStatus: IntakeStatus;
  conflictStatus: string; qualified: boolean | null; aiPriority: string | null;
  createdAt: string; assignedTo: { id: string; name: string } | null;
}
interface IntakeEvent {
  id: string; type: string; actorLabel: string; note: string | null;
  fromStatus: string | null; toStatus: string | null; createdAt: string;
}
interface Detail {
  lead: {
    id: string; name: string; email: string | null; phone: string | null;
    caseType: string; description: string | null; intakeStatus: IntakeStatus;
    addressOrJurisdiction: string | null; importantDates: string | null;
    adverseParties: string[]; conflictStatus: string; qualified: boolean | null;
    qualificationScore: number | null; aiPriority: string | null; aiSummary: string | null;
    aiRiskFlags: string[]; aiNextSteps: string[]; answers: Record<string, unknown> | null;
    assignedTo: { id: string; name: string } | null;
    conflictChecks: { id: string; matchCount: number; status: string }[];
    intakeEvents: IntakeEvent[];
  };
  missing: string[];
  users: { id: string; name: string }[];
  allowedTransitions: IntakeStatus[];
}

// The four headline cards (mirrors the intake mockup).
const SUMMARY_CARDS: { key: IntakeStatus; label: string }[] = [
  { key: "NEW", label: "New submissions" },
  { key: "NEEDS_REVIEW", label: "Awaiting review" },
  { key: "FOLLOW_UP", label: "Follow-up needed" },
  { key: "CONVERTED", label: "Converted" },
];

function fmtDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (isToday) return "Today";
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: IntakeStatus }) {
  const c = INTAKE_STATUS_COLORS[status];
  return <span style={{ fontSize: "0.72rem", fontWeight: 700, background: c.bg, color: c.text, padding: "0.15rem 0.55rem", borderRadius: 999, whiteSpace: "nowrap" }}>{INTAKE_STATUS_LABELS[status]}</span>;
}

function ConflictChip({ status }: { status: string }) {
  const map: Record<string, { icon: typeof ShieldCheck; color: string; label: string }> = {
    CLEAR: { icon: ShieldCheck, color: "var(--success)", label: "No conflict" },
    POTENTIAL_CONFLICT: { icon: ShieldAlert, color: "var(--danger)", label: "Potential conflict" },
    CONFIRMED_CONFLICT: { icon: ShieldAlert, color: "var(--danger)", label: "Conflict" },
    PENDING: { icon: ShieldQuestion, color: "var(--text-muted)", label: "Conflict pending" },
  };
  const m = map[status] || map.PENDING;
  const Icon = m.icon;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: m.color, fontWeight: 600 }}><Icon style={{ width: 14, height: 14 }} />{m.label}</span>;
}

export default function AiIntakePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IntakeStatus | "">("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/v1/intake?${params.toString()}`);
      const json = await res.json();
      if (json.success) { setItems(json.data.items); setCounts(json.data.counts); }
    } catch { toast.error("Failed to load intakes"); }
    finally { setLoading(false); }
  }, [filter, q]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/v1/intake/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
    } finally { setDetailLoading(false); }
  }, []);

  useEffect(() => { loadList(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);

  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/intake/${selectedId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Update failed"); return; }
      toast.success(okMsg);
      await Promise.all([loadDetail(selectedId), loadList()]);
    } catch { toast.error("Update failed"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="AI Intake"
        icon={ClipboardList}
        subtitle="Collect, review, and qualify prospective client information."
        actions={<Link href="/leads?new=1" className="lf-btn lf-btn-gold" style={{ padding: "0.625rem 1.25rem" }}><Plus style={{ width: 18, height: 18 }} /> New intake</Link>}
      />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        {SUMMARY_CARDS.map((c) => {
          const active = filter === c.key;
          return (
            <button key={c.key} onClick={() => setFilter(active ? "" : c.key)} className="lf-card" style={{ textAlign: "left", cursor: "pointer", border: active ? "1px solid var(--gold)" : "1px solid var(--border-default)", boxShadow: active ? "inset 3px 0 0 var(--gold)" : undefined }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{c.label}</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--navy)", marginTop: 2 }}>{counts[c.key] ?? 0}</p>
            </button>
          );
        })}
      </div>

      {/* Workspace: queue + detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 430px", gap: "1.25rem", alignItems: "start" }}>
        {/* Queue */}
        <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, border: "1px solid var(--border-default)", borderRadius: 8, padding: "0.15rem 0.6rem", background: "var(--bg-base)" }}>
              <Search style={{ width: 15, height: 15, color: "var(--text-muted)" }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadList()} placeholder="Search intakes…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", color: "var(--navy)", padding: "0.4rem 0" }} />
            </div>
            {filter && <button onClick={() => setFilter("")} className="lf-btn lf-btn-ghost" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}>Clear filter</button>}
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
          ) : items.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}><Inbox style={{ width: 24, height: 24, color: "var(--text-muted)" }} /></div>
              <p style={{ fontWeight: 700, color: "var(--navy)" }}>{filter || q ? "No matching intakes" : "No intakes yet"}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Share your public intake link from the Leads page, or add one manually.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 1rem", fontWeight: 700 }}>Prospect</th>
                  <th style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>Matter type</th>
                  <th style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>Owner</th>
                  <th style={{ padding: "0.6rem 1rem", fontWeight: 700, textAlign: "right" }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const selected = it.id === selectedId;
                  return (
                    <tr key={it.id} onClick={() => setSelectedId(it.id)} style={{ cursor: "pointer", borderTop: "1px solid var(--border-light)", background: selected ? "var(--bg-base)" : "transparent", boxShadow: selected ? "inset 3px 0 0 var(--gold)" : undefined }}>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: 600, color: "var(--navy)", fontSize: "0.875rem" }}>{it.name}</td>
                      <td style={{ padding: "0.7rem 0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{CASE_TYPE_LABELS[it.caseType] || it.caseType}</td>
                      <td style={{ padding: "0.7rem 0.5rem" }}><StatusBadge status={it.intakeStatus} /></td>
                      <td style={{ padding: "0.7rem 0.5rem", fontSize: "0.82rem", color: it.assignedTo ? "var(--navy)" : "var(--text-muted)" }}>{it.assignedTo?.name || "Unassigned"}</td>
                      <td style={{ padding: "0.7rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>{fmtDate(it.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <div className="lf-card" style={{ minHeight: 300 }}>
          {!selectedId ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
              <UserCircle2 style={{ width: 34, height: 34, color: "var(--text-muted)", margin: "0 auto 0.6rem" }} />
              <p style={{ fontWeight: 600, color: "var(--navy)" }}>Select an intake</p>
              <p style={{ fontSize: "0.85rem", marginTop: 3 }}>Pick a prospect from the queue to review the AI summary, facts, and next actions.</p>
            </div>
          ) : detailLoading || !detail ? (
            <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
          ) : (
            <IntakeDetail detail={detail} busy={busy} note={note} setNote={setNote}
              onStatus={(to) => patch({ action: "status", toStatus: to }, `Moved to ${INTAKE_STATUS_LABELS[to]}`)}
              onAssign={(id) => patch({ action: "assign", assignedToId: id || null }, "Assignment updated")}
              onNote={() => { if (note.trim()) patch({ action: "note", note }, "Note added").then(() => setNote("")); }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "1.1rem" }}>
      <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.4rem" }}>{title}</p>
      {children}
    </div>
  );
}

function IntakeDetail({ detail, busy, note, setNote, onStatus, onAssign, onNote }: {
  detail: Detail; busy: boolean; note: string; setNote: (s: string) => void;
  onStatus: (to: IntakeStatus) => void; onAssign: (id: string) => void; onNote: () => void;
}) {
  const l = detail.lead;
  const answers = l.answers && typeof l.answers === "object" ? Object.entries(l.answers) : [];
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, color: "var(--navy)" }}>{l.name}</h2>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>{CASE_TYPE_LABELS[l.caseType] || l.caseType}{l.email ? ` · ${l.email}` : ""}{l.phone ? ` · ${l.phone}` : ""}</div>
        </div>
        <StatusBadge status={l.intakeStatus} />
      </div>

      {/* Status actions */}
      <Section title="Move to">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {detail.allowedTransitions.length === 0 && <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No further actions.</span>}
          {detail.allowedTransitions.map((to) => {
            const terminal = to === "DECLINED" || to === "ARCHIVED";
            return (
              <button key={to} onClick={() => onStatus(to)} disabled={busy}
                className={terminal ? "lf-btn lf-btn-outline" : "lf-btn lf-btn-gold"}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                {!terminal && <ArrowRight style={{ width: 13, height: 13 }} />}{INTAKE_STATUS_LABELS[to]}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Assignment */}
      <Section title="Assigned to">
        <select value={l.assignedTo?.id || ""} onChange={(e) => onAssign(e.target.value)} disabled={busy}
          style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.85rem", color: "var(--navy)", background: "var(--bg-card)" }}>
          <option value="">Unassigned</option>
          {detail.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </Section>

      {/* AI summary */}
      {l.aiSummary && (
        <Section title="AI summary">
          <div style={{ background: "var(--bg-base)", borderRadius: 8, padding: "0.7rem 0.85rem", fontSize: "0.86rem", color: "var(--navy)", lineHeight: 1.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--gold)", fontWeight: 700, marginBottom: 4 }}><Sparkles style={{ width: 12, height: 12 }} /> AI-GENERATED · VERIFY BEFORE RELYING</div>
            {l.aiSummary}
          </div>
        </Section>
      )}

      {/* Key facts */}
      <Section title="Key facts">
        <div style={{ fontSize: "0.85rem", color: "var(--navy)", display: "flex", flexDirection: "column", gap: 4 }}>
          {l.description && <div><span style={{ color: "var(--text-secondary)" }}>Matter: </span>{l.description}</div>}
          {l.addressOrJurisdiction && <div><span style={{ color: "var(--text-secondary)" }}>Jurisdiction: </span>{l.addressOrJurisdiction}</div>}
          {l.adverseParties.length > 0 && <div><span style={{ color: "var(--text-secondary)" }}>Adverse parties: </span>{l.adverseParties.join(", ")}</div>}
          {l.qualificationScore != null && <div><span style={{ color: "var(--text-secondary)" }}>AI qualification: </span>{l.qualified ? "Qualified" : "Needs attention"} ({l.qualificationScore}/100)</div>}
        </div>
      </Section>

      {/* Conflict */}
      <Section title="Conflict check">
        <ConflictChip status={l.conflictStatus} />
        {l.conflictChecks[0]?.matchCount > 0 && <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: 8 }}>{l.conflictChecks[0].matchCount} potential match(es)</span>}
      </Section>

      {/* Potential deadlines */}
      {l.importantDates && (
        <Section title="Potential deadlines">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.85rem", color: "var(--navy)" }}><CalendarClock style={{ width: 15, height: 15, color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />{l.importantDates}</div>
        </Section>
      )}

      {/* Missing info */}
      {detail.missing.length > 0 && (
        <Section title="Missing information">
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {detail.missing.map((m) => <div key={m} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.83rem", color: "var(--text-secondary)" }}><AlertTriangle style={{ width: 13, height: 13, color: "var(--warning)" }} />{m}</div>)}
          </div>
        </Section>
      )}

      {/* Recommended next action */}
      {l.aiNextSteps.length > 0 && (
        <Section title="Recommended next action">
          <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem", color: "var(--navy)", display: "flex", flexDirection: "column", gap: 3 }}>
            {l.aiNextSteps.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
      )}

      {/* Transcript */}
      {answers.length > 0 && (
        <Section title="Source transcript">
          <div style={{ background: "var(--bg-base)", borderRadius: 8, padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column", gap: 5 }}>
            {answers.map(([k, v]) => (
              <div key={k} style={{ fontSize: "0.8rem" }}><span style={{ color: "var(--text-secondary)" }}>{k}: </span><span style={{ color: "var(--navy)" }}>{String(v)}</span></div>
            ))}
          </div>
        </Section>
      )}

      {/* Audit trail */}
      <Section title="Audit trail">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {detail.lead.intakeEvents.length === 0 && <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No activity yet.</span>}
          {detail.lead.intakeEvents.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: "0.55rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.actorLabel === "AI" ? "var(--gold)" : e.actorLabel === "System" ? "var(--text-muted)" : "var(--brand)", marginTop: 5, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--navy)" }}>{e.note || e.type}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{e.actorLabel} · {new Date(e.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.7rem" }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onNote()} placeholder="Add a note…" style={{ flex: 1, minWidth: 0, padding: "0.4rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.83rem", color: "var(--navy)" }} />
          <button onClick={onNote} disabled={busy || !note.trim()} className="lf-btn lf-btn-outline" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}>Add</button>
        </div>
      </Section>
    </div>
  );
}
