"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useFirm } from "@/components/providers/firm-provider";
import { CaseIntelligence } from "@/components/case/case-intelligence";
import { SimilarMatters } from "@/components/case/similar-matters";
import { CaseDeliveries } from "@/components/delivery/case-deliveries";
import { CasePortal } from "@/components/case/case-portal";
import { CaseSummary } from "@/components/ai/case-summary";
import { CASE_TYPE_LABELS, CASE_STATUS_LABELS } from "@/lib/constants";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Briefcase, CalendarClock, DollarSign, FileText, Clock, AlertCircle,
  Mail, Phone, Building, Loader2, Sparkles, Plus, Upload, CheckSquare, MessageSquare,
  Users, StickyNote, Activity as ActivityIcon, ListChecks, Scale, Timer, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CaseClient { id: string; name: string; email: string; phone: string | null; clientType: string; company: string | null; }
interface CaseDeadline { id: string; title: string; dueDate: string; deadlineType: string; status: string; priority: string; }
interface BillingLineItem { id: string; description: string; quantity: number; rate: number; amount: number; }
interface BillingRecord { id: string; invoiceNumber: string; totalAmount: number; paidAmount: number; paymentStatus: string; issueDate: string | null; dueDate: string; lineItems: BillingLineItem[]; }
interface CaseData {
  id: string; caseNumber: string; title: string; description: string | null; status: string; caseType: string; priority: string; notes: string | null; createdAt: string;
  openedDate: string | null; filingDate: string | null; statuteOfLimitations: string | null; jurisdiction: string | null; courtName: string | null;
  responsibleAttorneyId: string | null; assignedTeamIds: string[]; opposingParties: string[]; opposingCounsel: string | null;
  billingType: string | null; hourlyRate: number | null; flatFee: number | null; contingencyPct: number | null; retainerAmount: number | null; engagementLetterStatus: string | null; trustAccount: boolean;
  client: CaseClient; deadlines: CaseDeadline[]; billingRecords: BillingRecord[];
}
interface Doc { id: string; title: string; documentType: string; signatureStatus: string; updatedAt: string; }
interface Task { id: string; title: string; status: string; dueDate: string | null; assignee: { id: string; name: string } | null; }
interface FirmUser { id: string; name: string; role: string; }

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#dbeafe", text: "#1e40af" }, ACTIVE: { bg: "#dcfce7", text: "#15803d" },
  ON_HOLD: { bg: "#fef3c7", text: "#b45309" }, PENDING: { bg: "#fef3c7", text: "#b45309" },
  CLOSED: { bg: "#f1f5f9", text: "#475569" }, ARCHIVED: { bg: "#f1f5f9", text: "#64748b" },
};
const priorityStyles: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "var(--danger-bg)", text: "var(--danger)" }, URGENT: { bg: "var(--danger-bg)", text: "var(--danger)" },
  MEDIUM: { bg: "var(--warning-bg)", text: "var(--warning)" }, LOW: { bg: "var(--success-bg)", text: "var(--success)" },
};
const paymentStyles: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "var(--success-bg)", text: "var(--success)" }, UNPAID: { bg: "var(--danger-bg)", text: "var(--danger)" },
  PARTIAL: { bg: "var(--warning-bg)", text: "var(--warning)" }, OVERDUE: { bg: "var(--danger-bg)", text: "var(--danger)" },
  OUTSTANDING: { bg: "var(--danger-bg)", text: "var(--danger)" }, VOID: { bg: "#F3F4F6", text: "var(--text-secondary)" },
};
const taskStatusLabels: Record<string, string> = { TODO: "To do", IN_PROGRESS: "In progress", BLOCKED: "Blocked", WAITING_APPROVAL: "Awaiting approval", DONE: "Done", CANCELLED: "Cancelled" };

function getInitials(name: string): string { return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2); }
function formatStatusLabel(status: string): string { return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }
function isOpenDeadline(d: CaseDeadline) { return d.status === "PENDING" || d.status === "OVERDUE"; }

const TABS = [
  { key: "overview", label: "Overview", icon: Briefcase },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "deadlines", label: "Deadlines", icon: CalendarClock },
  { key: "communications", label: "Communications", icon: MessageSquare },
  { key: "billing", label: "Billing", icon: DollarSign },
  { key: "people", label: "People", icon: Users },
  { key: "notes", label: "Notes", icon: StickyNote },
];

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="lf-card" style={style}>{children}</div>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>{children}</h2>;
}

export default function CaseWorkspace() {
  const params = useParams();
  const id = params.id as string;
  const { firm } = useFirm();

  const [c, setC] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<FirmUser[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      const json = await res.json();
      if (json.success) setC(json.data); else setNotFound(true);
    } catch { toast.error("Failed to load case"); setNotFound(true); }
    finally { setLoading(false); }
  }, [id]);

  const loadDocs = useCallback(() => { fetch(`/api/v1/documents?caseId=${id}`).then((r) => r.json()).then((j) => { if (j.success) setDocs(j.data); }).catch(() => {}); }, [id]);
  const loadTasks = useCallback(() => { fetch(`/api/v1/cases/${id}/tasks`).then((r) => r.json()).then((j) => { if (j.success) setTasks(j.data); }).catch(() => {}); }, [id]);

  useEffect(() => { loadCase(); loadDocs(); loadTasks(); fetch("/api/v1/firm/users").then((r) => r.json()).then((j) => { if (j.success) setUsers(j.data); }).catch(() => {}); }, [loadCase, loadDocs, loadTasks]);

  const userName = useCallback((uid: string | null) => users.find((u) => u.id === uid)?.name || "Unassigned", [users]);

  const assignAttorney = async (uid: string) => {
    const res = await fetch(`/api/v1/cases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responsibleAttorneyId: uid || null }) });
    if (res.ok) { toast.success("Responsible attorney updated"); loadCase(); }
    else toast.error("Could not update the assignment");
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return;
    setSavingTask(true);
    try {
      const res = await fetch(`/api/v1/cases/${id}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: taskTitle, assigneeId: taskAssignee || undefined, dueDate: taskDue || undefined }) });
      if (res.ok) { toast.success("Task added"); setTaskTitle(""); setTaskAssignee(""); setTaskDue(""); setShowTaskForm(false); loadTasks(); }
      else { const j = await res.json().catch(() => ({})); toast.error(j.error || "Could not add task"); }
    } finally { setSavingTask(false); }
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    const t = toast.loading(`Uploading “${file.name}”…`);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("caseId", id);
      const res = await fetch("/api/v1/documents", { method: "POST", body: fd });
      const j = await res.json(); toast.dismiss(t);
      if (!res.ok) { toast.error(j.error || "Upload failed"); return; }
      toast.success("Document uploaded"); loadDocs();
    } catch { toast.dismiss(t); toast.error("Upload failed"); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  const totalBilled = useMemo(() => (c?.billingRecords || []).reduce((s, b) => s + Number(b.totalAmount), 0), [c]);
  const outstanding = useMemo(() => (c?.billingRecords || []).reduce((s, b) => s + Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)), 0), [c]);
  const nextDeadline = useMemo(() => (c?.deadlines || []).filter(isOpenDeadline).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0], [c]);
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED"), [tasks]);

  if (loading) return <div className="lf-card"><div className="lf-empty"><Loader2 className="lf-empty-icon" style={{ animation: "spin 1s linear infinite" }} /><p className="lf-empty-title">Loading case…</p></div></div>;
  if (notFound || !c) return (
    <div className="space-y-6">
      <Link href="/cases" className="lf-btn lf-btn-ghost"><ArrowLeft style={{ width: 18, height: 18 }} /> Back to Cases</Link>
      <div className="lf-card"><div className="lf-empty"><Briefcase className="lf-empty-icon" /><p className="lf-empty-title">Case not found</p></div></div>
    </div>
  );

  const sb = statusBadgeStyles[c.status] || statusBadgeStyles.ACTIVE;
  const pb = priorityStyles[c.priority] || priorityStyles.MEDIUM;

  // Derived recent-activity feed from the data we have.
  const activity = [
    ...docs.map((d) => ({ when: d.updatedAt, icon: FileText, text: `Document: ${d.title}` })),
    ...c.billingRecords.map((b) => ({ when: b.issueDate || b.dueDate, icon: DollarSign, text: `Invoice ${b.invoiceNumber} — ${formatCurrency(Number(b.totalAmount))}` })),
    ...c.deadlines.map((d) => ({ when: d.dueDate, icon: CalendarClock, text: `Deadline: ${d.title}` })),
    { when: c.createdAt, icon: Briefcase, text: "Case opened" },
  ].filter((a) => a.when).sort((a, b) => +new Date(b.when!) - +new Date(a.when!)).slice(0, 15);

  return (
    <div>
      <input ref={fileInput} type="file" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <Link href="/cases" style={{ color: "var(--text-muted)", marginTop: 4 }}><ArrowLeft style={{ width: 20, height: 20 }} /></Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>{c.title}</h1>
            <span className="lf-badge" style={{ background: sb.bg, color: sb.text }}>{CASE_STATUS_LABELS[c.status] || formatStatusLabel(c.status)}</span>
            <span className="lf-badge" style={{ background: pb.bg, color: pb.text }}>{formatStatusLabel(c.priority)}</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>{c.caseNumber} · {CASE_TYPE_LABELS[c.caseType] || c.caseType} · Opened {formatDate(c.openedDate || c.createdAt)}</p>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button onClick={() => { setTab("tasks"); setShowTaskForm(true); }} className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.85rem", fontSize: "0.83rem" }}><CheckSquare style={{ width: 15, height: 15 }} /> Add task</button>
        <button onClick={() => fileInput.current?.click()} disabled={uploading} className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.85rem", fontSize: "0.83rem" }}>{uploading ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 15, height: 15 }} />} Upload document</button>
        <Link href={`/deadlines/new?case=${id}`} className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.85rem", fontSize: "0.83rem" }}><CalendarClock style={{ width: 15, height: 15 }} /> Add deadline</Link>
        <button disabled title="Time tracking — coming soon" className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.85rem", fontSize: "0.83rem", opacity: 0.5, cursor: "not-allowed" }}><Timer style={{ width: 15, height: 15 }} /> Record time <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>· soon</span></button>
        <button onClick={() => setTab("communications")} className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.85rem", fontSize: "0.83rem" }}><MessageSquare style={{ width: 15, height: 15 }} /> Send message</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border-default)", marginBottom: "1.25rem", overflowX: "auto" }}>
        {TABS.map((t) => {
          const on = tab === t.key; const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.6rem 0.85rem", fontSize: "0.85rem", fontWeight: on ? 700 : 500, color: on ? "var(--navy)" : "var(--text-secondary)", background: "none", border: "none", borderBottom: on ? "2px solid var(--gold)" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", marginBottom: -1 }}>
              <Icon style={{ width: 15, height: 15 }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Next deadline */}
            <Card>
              <H2>Next deadline</H2>
              {nextDeadline ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-base)", borderRadius: 8, padding: "0.75rem 0.9rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <AlertCircle style={{ width: 18, height: 18, color: new Date(nextDeadline.dueDate) < new Date() ? "var(--danger)" : "var(--gold)" }} />
                    <div><p style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{nextDeadline.title}</p><p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatStatusLabel(nextDeadline.deadlineType)}</p></div>
                  </div>
                  <span style={{ fontWeight: 700, color: new Date(nextDeadline.dueDate) < new Date() ? "var(--danger)" : "var(--navy)", fontSize: "0.9rem" }}>{formatDate(nextDeadline.dueDate)}</span>
                </div>
              ) : <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No upcoming deadlines. <Link href={`/deadlines/new?case=${id}`} style={{ color: "var(--gold)" }}>Add one →</Link></p>}
            </Card>

            {/* Tasks needing attention */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><H2>Tasks requiring attention</H2><button onClick={() => setTab("tasks")} style={{ fontSize: "0.78rem", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all</button></div>
              {openTasks.length === 0 ? <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No open tasks.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {openTasks.slice(0, 4).map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-base)", borderRadius: 8, padding: "0.55rem 0.75rem" }}>
                      <span style={{ fontSize: "0.86rem", color: "var(--navy)" }}>{t.title}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{taskStatusLabels[t.status] || t.status}{t.assignee ? ` · ${t.assignee.name}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* AI case summary */}
            {firm?.aiModeEnabled ? <CaseIntelligence caseId={id} /> : <CaseSummary caseId={id} />}

            {/* Recent activity */}
            <Card>
              <H2>Recent activity</H2>
              <ActivityFeed items={activity.slice(0, 6)} />
            </Card>
          </div>

          {/* Right rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Financial summary */}
            <Card>
              <H2>Financials</H2>
              <Row label="Total billed" value={formatCurrency(totalBilled)} />
              <Row label="Outstanding" value={formatCurrency(outstanding)} danger={outstanding > 0} />
              {c.billingType && <Row label="Arrangement" value={billingSummary(c)} />}
              {c.retainerAmount ? <Row label="Retainer" value={formatCurrency(c.retainerAmount)} /> : null}
            </Card>

            {/* Client + opposing */}
            <Card>
              <H2>Client</H2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>{getInitials(c.client.name)}</div>
                <div><p style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{c.client.name}</p><p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatStatusLabel(c.client.clientType)}</p></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                {c.client.email && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail style={{ width: 13, height: 13 }} />{c.client.email}</span>}
                {c.client.phone && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone style={{ width: 13, height: 13 }} />{c.client.phone}</span>}
              </div>
              {c.opposingParties.length > 0 && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-light)" }}>
                  <p style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>Opposing</p>
                  <p style={{ fontSize: "0.84rem", color: "var(--navy)" }}>{c.opposingParties.join(", ")}</p>
                  {c.opposingCounsel && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Counsel: {c.opposingCounsel}</p>}
                </div>
              )}
            </Card>

            <Link href={`/cases/${id}/draft`} className="lf-card-interactive" style={{ display: "flex", alignItems: "center", gap: "0.7rem", textDecoration: "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(196,154,46,0.12)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Sparkles style={{ width: 18, height: 18 }} /></div>
              <div><p style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.88rem" }}>Draft document with AI</p><p style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Letters, memos, and motions</p></div>
            </Link>
          </div>
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {tab === "activity" && <Card><H2>Activity</H2><ActivityFeed items={activity} /></Card>}

      {/* ── DOCUMENTS ── */}
      {tab === "documents" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <H2>Documents</H2>
            <button onClick={() => fileInput.current?.click()} disabled={uploading} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.9rem", fontSize: "0.83rem" }}>{uploading ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 15, height: 15 }} />} Upload</button>
          </div>
          {docs.length === 0 ? <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No documents on this matter yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {docs.map((d) => (
                <Link key={d.id} href={`/documents/${d.id}`} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.7rem", borderRadius: 8, background: "var(--bg-base)", textDecoration: "none" }}>
                  <FileText style={{ width: 17, height: 17, color: "var(--gold)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.87rem", color: "var(--navy)", fontWeight: 500 }}>{d.title}</span>
                  {d.signatureStatus === "PENDING" && <span className="lf-badge" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>Needs signature</span>}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatDate(d.updatedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── TASKS ── */}
      {tab === "tasks" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <H2>Tasks</H2>
            <button onClick={() => setShowTaskForm((v) => !v)} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.9rem", fontSize: "0.83rem" }}><Plus style={{ width: 15, height: 15 }} /> Add task</button>
          </div>
          {showTaskForm && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", background: "var(--bg-base)", borderRadius: 10, padding: "0.75rem", marginBottom: "0.75rem" }}>
              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createTask()} placeholder="Task title…" autoFocus style={{ flex: 2, minWidth: 180, padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.86rem", color: "var(--navy)" }} />
              <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} style={{ flex: 1, minWidth: 120, padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.84rem", color: "var(--navy)", background: "var(--bg-card)" }}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} style={{ padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.84rem", color: "var(--navy)" }} />
              <button onClick={createTask} disabled={savingTask || !taskTitle.trim()} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem", fontSize: "0.84rem" }}>{savingTask ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : "Add"}</button>
            </div>
          )}
          {tasks.length === 0 ? <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No tasks yet. Add one above, or they&apos;ll be created automatically by workflows.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {tasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", borderRadius: 8, background: "var(--bg-base)", opacity: t.status === "DONE" || t.status === "CANCELLED" ? 0.6 : 1 }}>
                  <span style={{ fontSize: "0.87rem", color: "var(--navy)", textDecoration: t.status === "DONE" ? "line-through" : "none" }}>{t.title}</span>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{taskStatusLabels[t.status] || t.status}{t.assignee ? ` · ${t.assignee.name}` : ""}{t.dueDate ? ` · ${formatDate(t.dueDate)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── DEADLINES ── */}
      {tab === "deadlines" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}><H2>Deadlines</H2><Link href={`/deadlines/new?case=${id}`} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.9rem", fontSize: "0.83rem" }}><Plus style={{ width: 15, height: 15 }} /> Add</Link></div>
          {c.deadlines.length === 0 ? <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No deadlines set for this case.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {c.deadlines.map((d) => {
                const overdue = d.status === "OVERDUE" || (d.status === "PENDING" && new Date(d.dueDate) < new Date());
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", borderRadius: 8, background: overdue ? "var(--danger-bg)" : "var(--bg-base)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {d.status === "COMPLETED" ? <Clock style={{ width: 16, height: 16, color: "var(--success)" }} /> : <AlertCircle style={{ width: 16, height: 16, color: overdue ? "var(--danger)" : "var(--gold)" }} />}
                      <div><p style={{ fontSize: "0.87rem", fontWeight: 600, color: overdue ? "var(--danger)" : "var(--navy)" }}>{d.title}</p><p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatStatusLabel(d.deadlineType)}</p></div>
                    </div>
                    <span style={{ fontSize: "0.83rem", fontWeight: 600, color: overdue ? "var(--danger)" : "var(--text-secondary)" }}>{formatDate(d.dueDate)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── COMMUNICATIONS ── */}
      {tab === "communications" && (
        <Card>
          <H2>Communications</H2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "0.9rem" }}>Secure two-way messaging with your client runs through the client portal. Enable the portal to share a private link — the client can message you, upload documents, and track progress with no login.</p>
          <CasePortal caseId={id} />
        </Card>
      )}

      {/* ── BILLING ── */}
      {tab === "billing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <H2>Billing summary</H2>
            <Row label="Total billed" value={formatCurrency(totalBilled)} />
            <Row label="Outstanding" value={formatCurrency(outstanding)} danger={outstanding > 0} />
            {c.billingType && <Row label="Arrangement" value={billingSummary(c)} />}
            {c.retainerAmount ? <Row label="Retainer" value={formatCurrency(c.retainerAmount)} /> : null}
            {c.engagementLetterStatus && <Row label="Engagement letter" value={formatStatusLabel(c.engagementLetterStatus)} />}
            {c.trustAccount && <Row label="Trust account" value="Yes (IOLTA)" />}
          </Card>
          <Card style={{ padding: c.billingRecords.length > 0 ? 0 : undefined, overflow: "hidden" }}>
            {c.billingRecords.length > 0 ? (
              <>
                <div style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--border-light)" }}><H2>Invoices</H2></div>
                <table className="lf-table">
                  <thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Amount</th><th>Paid</th><th>Status</th></tr></thead>
                  <tbody>
                    {c.billingRecords.map((b) => {
                      const bs = paymentStyles[b.paymentStatus] || paymentStyles.UNPAID;
                      return <tr key={b.id}><td style={{ fontWeight: 500, color: "var(--navy)" }}>{b.invoiceNumber}</td><td>{b.issueDate ? formatDate(b.issueDate) : "—"}</td><td>{formatDate(b.dueDate)}</td><td style={{ fontWeight: 600 }}>{formatCurrency(Number(b.totalAmount))}</td><td>{formatCurrency(Number(b.paidAmount))}</td><td><span className="lf-badge" style={{ background: bs.bg, color: bs.text }}>{formatStatusLabel(b.paymentStatus)}</span></td></tr>;
                    })}
                  </tbody>
                </table>
              </>
            ) : <><H2>Invoices</H2><p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No invoices yet.</p></>}
          </Card>
        </div>
      )}

      {/* ── PEOPLE ── */}
      {tab === "people" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          <Card>
            <H2>Client</H2>
            <p style={{ fontWeight: 600, color: "var(--navy)" }}>{c.client.name}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4 }}>
              {c.client.email && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail style={{ width: 13, height: 13 }} />{c.client.email}</span>}
              {c.client.phone && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone style={{ width: 13, height: 13 }} />{c.client.phone}</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Building style={{ width: 13, height: 13 }} />{formatStatusLabel(c.client.clientType)}</span>
            </div>
          </Card>
          <Card>
            <H2>Legal team</H2>
            <div style={{ marginBottom: "0.6rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4 }}>Responsible attorney</p>
              <select value={c.responsibleAttorneyId || ""} onChange={(e) => assignAttorney(e.target.value)}
                style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: `1px solid ${c.responsibleAttorneyId ? "var(--border-default)" : "var(--warning)"}`, fontSize: "0.86rem", color: "var(--navy)", background: "var(--bg-card)" }}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {c.assignedTeamIds.length > 0 && <Row label="Supporting team" value={c.assignedTeamIds.map(userName).join(", ")} />}
            {c.jurisdiction && <Row label="Jurisdiction" value={c.jurisdiction} />}
            {c.courtName && <Row label="Court / agency" value={c.courtName} />}
          </Card>
          {c.opposingParties.length > 0 && (
            <Card><H2>Opposing parties</H2><p style={{ fontSize: "0.88rem", color: "var(--navy)" }}>{c.opposingParties.join(", ")}</p>{c.opposingCounsel && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>Counsel: {c.opposingCounsel}</p>}</Card>
          )}
        </div>
      )}

      {/* ── NOTES ── */}
      {tab === "notes" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}><H2>Notes</H2><Link href={`/cases/${id}/edit`} className="lf-btn lf-btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Edit case</Link></div>
          {c.description && <><p style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>Description</p><p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>{c.description}</p></>}
          <p style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>Internal notes</p>
          <p style={{ fontSize: "0.9rem", color: c.notes ? "var(--text-secondary)" : "var(--text-muted)", lineHeight: 1.5 }}>{c.notes || "No notes yet. Use “Edit case” to add internal notes."}</p>
        </Card>
      )}

      {/* Similar matters + delivery live under Overview's AI area for AI firms */}
      {tab === "overview" && firm?.aiModeEnabled && <div style={{ marginTop: "1.25rem" }}><SimilarMatters caseId={id} /></div>}
      {tab === "overview" && <div style={{ marginTop: "1.25rem" }}><CaseDeliveries caseId={id} /></div>}
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", fontSize: "0.86rem", padding: "0.3rem 0" }}><span style={{ color: "var(--text-secondary)" }}>{label}</span><span style={{ fontWeight: 600, color: danger ? "var(--danger)" : "var(--navy)", textAlign: "right" }}>{value}</span></div>;
}

function ActivityFeed({ items }: { items: { when?: string | null; icon: React.ComponentType<{ style?: React.CSSProperties }>; text: string }[] }) {
  if (items.length === 0) return <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>No recent activity.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {items.map((a, i) => { const Icon = a.icon; return (
        <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon style={{ width: 14, height: 14 }} /></div>
          <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--navy)" }}>{a.text}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.when ? formatDate(a.when) : ""}</span>
        </div>
      ); })}
    </div>
  );
}

function billingSummary(c: CaseData): string {
  if (c.billingType === "HOURLY") return `Hourly${c.hourlyRate ? ` · $${c.hourlyRate}/hr` : ""}`;
  if (c.billingType === "FLAT_FEE") return `Flat fee${c.flatFee ? ` · $${c.flatFee}` : ""}`;
  if (c.billingType === "CONTINGENCY") return `Contingency${c.contingencyPct ? ` · ${c.contingencyPct}%` : ""}`;
  return "—";
}
