"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, RefreshCw, ShieldAlert, Gauge, ListChecks, FileSearch,
  Scale, BookOpen, Clock, FolderClock, AlertTriangle, FileText, ArrowRight, PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { CASE_STATUS_LABELS, CASE_TYPE_LABELS } from "@/lib/constants";

interface Ai {
  summary: string;
  strengthScore: number; strengthRationale: string;
  riskScore: number; riskRationale: string;
  missingEvidence: string[];
  potentialDefenses: string[];
  nextSteps: string[];
  recommendedDocuments: { title: string; why: string }[];
  statutes: { citation: string; relevance: string }[];
  caseLaw: { citation: string; holding: string; relevance: string }[];
}
interface Data {
  ai: Ai | null;
  aiAnalyzedAt: string | null;
  priorMatters: { id: string; caseNumber: string; title: string; status: string; caseType: string }[];
  outstandingTasks: { id: string; title: string; dueDate: string; status: string; priority: string; deadlineType: string }[];
  timeline: { date: string; label: string; kind: string }[];
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function CaseIntelligence({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [draftingIdx, setDraftingIdx] = useState<number | null>(null);

  const draftDocument = useCallback(async (idx: number, title: string, why: string) => {
    setDraftingIdx(idx);
    const t = toast.loading(`Drafting “${title}”…`);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/draft-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, guidance: why }),
      });
      const json = await res.json();
      toast.dismiss(t);
      if (!res.ok || !json.success) { toast.error(json.error || "Draft failed"); return; }
      toast.success("Draft filed to the matter", {
        action: { label: "Open", onClick: () => router.push(`/documents/${json.data.id}`) },
      });
    } catch {
      toast.dismiss(t);
      toast.error("Draft failed");
    } finally {
      setDraftingIdx(null);
    }
  }, [caseId, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/intelligence`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    const t = toast.loading("Analyzing the matter…");
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/intelligence`, { method: "POST" });
      const json = await res.json();
      toast.dismiss(t);
      if (!res.ok) { toast.error(json.error || "Analysis failed"); return; }
      setData(json.data);
      toast.success("Case analysis updated");
    } finally { setGenerating(false); }
  };

  if (loading) {
    return <div className="lf-card" style={{ padding: "1.5rem", textAlign: "center" }}><Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite", color: "var(--brand)" }} /></div>;
  }

  const ai = data?.ai;

  return (
    <div className="lf-card" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderTop: "3px solid var(--brand)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, color: "var(--navy)", lineHeight: 1.1 }}>AI Case Intelligence</h2>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {data?.aiAnalyzedAt ? `Analyzed ${fmtDate(data.aiAnalyzedAt)}` : "Not yet analyzed"} · decision-support, attorney verifies
          </div>
        </div>
        <button onClick={generate} disabled={generating} className="lf-btn lf-btn-primary" style={{ padding: "0.5rem 0.9rem", opacity: generating ? 0.6 : 1 }}>
          {generating ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 15, height: 15 }} />}
          {ai ? "Regenerate" : "Analyze case"}
        </button>
      </div>

      {/* Scores + summary (AI) */}
      {ai ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <ScoreCard label="Strength Score" score={ai.strengthScore} rationale={ai.strengthRationale} good icon={Gauge} />
            <ScoreCard label="Risk Score" score={ai.riskScore} rationale={ai.riskRationale} good={false} icon={ShieldAlert} />
          </div>
          <Block icon={FileSearch} title="Case Summary">
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{ai.summary}</p>
          </Block>
        </>
      ) : (
        <div style={{ padding: "1.25rem", background: "var(--bg-base)", borderRadius: 10, textAlign: "center", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Run an AI analysis to get a summary, strength &amp; risk scores, missing evidence, defenses, recommended documents, and research leads for this matter.</p>
        </div>
      )}

      {/* Real-data + AI lists */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Timeline (real) */}
        <Block icon={Clock} title="Timeline" count={data?.timeline.length}>
          {data?.timeline.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.timeline.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: 66, fontVariantNumeric: "tabular-nums" }}>{fmtDate(e.date)}</span>
                  <span style={{ fontSize: "0.83rem", color: "var(--navy)" }}>{e.label}</span>
                </div>
              ))}
            </div>
          ) : <Empty>No dated events yet.</Empty>}
        </Block>

        {/* Outstanding tasks (real) */}
        <Block icon={ListChecks} title="Outstanding Tasks" count={data?.outstandingTasks.length}>
          {data?.outstandingTasks.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {data.outstandingTasks.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.83rem" }}>
                  <span style={{ color: "var(--navy)" }}>{t.title}</span>
                  <span style={{ color: t.status === "OVERDUE" ? "var(--danger)" : "var(--text-muted)", whiteSpace: "nowrap", fontSize: "0.75rem" }}>{fmtDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          ) : <Empty>No open tasks.</Empty>}
        </Block>

        {ai && <ListBlock icon={FileSearch} title="Missing Evidence" items={ai.missingEvidence} tone="warning" />}
        {ai && <ListBlock icon={AlertTriangle} title="Potential Defenses" items={ai.potentialDefenses} />}
        {ai && <ListBlock icon={ListChecks} title="Likely Next Steps" items={ai.nextSteps} tone="brand" />}
        {ai && (
          <Block icon={FileText} title="Recommended Documents" count={ai.recommendedDocuments.length}>
            {ai.recommendedDocuments.length ? ai.recommendedDocuments.map((d, i) => (
              <div key={i} style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)" }}>{d.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{d.why}</div>
                </div>
                <button
                  onClick={() => draftDocument(i, d.title, d.why)}
                  disabled={draftingIdx !== null}
                  className="lf-btn lf-btn-primary"
                  style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", flexShrink: 0, opacity: draftingIdx !== null && draftingIdx !== i ? 0.5 : 1 }}
                  title="AI-draft this document and file it to the matter"
                >
                  {draftingIdx === i
                    ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                    : <PenLine style={{ width: 13, height: 13 }} />}
                  Draft
                </button>
              </div>
            )) : <Empty>—</Empty>}
          </Block>
        )}

        {/* Prior matters (real) */}
        <Block icon={FolderClock} title="Relevant Prior Matters" count={data?.priorMatters.length}>
          {data?.priorMatters.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.priorMatters.map((m) => (
                <div key={m.id} onClick={() => router.push(`/cases/${m.id}`)}
                  style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.4rem 0.4rem", borderRadius: 6, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{m.caseNumber} · {CASE_TYPE_LABELS[m.caseType] || m.caseType} · {CASE_STATUS_LABELS[m.status] || m.status}</div>
                  </div>
                  <ArrowRight style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ) : <Empty>No related matters on file.</Empty>}
        </Block>
      </div>

      {/* Research leads — statutes + case law, with verify guardrail */}
      {ai && (ai.statutes.length > 0 || ai.caseLaw.length > 0) && (
        <div style={{ marginTop: "1.25rem", padding: "1rem 1.15rem", borderRadius: 10, background: "var(--warning-bg)", border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.75rem" }}>
            <AlertTriangle style={{ width: 15, height: 15, color: "var(--warning)" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--warning)" }}>AI-suggested research leads — verify every citation before relying on it. AI can invent cases.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}><Scale style={{ width: 15, height: 15 }} /> Statutes</h4>
              {ai.statutes.length ? ai.statutes.map((s, i) => (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", fontFamily: "var(--font-mono, monospace)" }}>{s.citation}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>{s.relevance}</div>
                </div>
              )) : <Empty>—</Empty>}
            </div>
            <div>
              <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}><BookOpen style={{ width: 15, height: 15 }} /> Case Law</h4>
              {ai.caseLaw.length ? ai.caseLaw.map((c, i) => (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)" }}>{c.citation}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>{c.holding} — {c.relevance}</div>
                </div>
              )) : <Empty>—</Empty>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score, rationale, good, icon: Icon }: { label: string; score: number; rationale: string; good: boolean; icon: React.ElementType }) {
  // Strength: high=good (green). Risk: high=bad (red).
  const positive = good ? score >= 60 : score < 40;
  const color = positive ? "var(--success)" : score >= 40 && score < 70 ? "var(--warning)" : good ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ padding: "1rem 1.15rem", borderRadius: 12, background: "var(--bg-base)", border: "1px solid var(--border-light)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
        <Icon style={{ width: 14, height: 14, color }} /> {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "0.25rem 0" }}>
        <span style={{ fontSize: "2rem", fontWeight: 800, color, fontFamily: "var(--font-heading)", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/ 100</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--secondary)", overflow: "hidden", marginBottom: "0.5rem" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color }} />
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{rationale}</div>
    </div>
  );
}

function Block({ icon: Icon, title, count, children }: { icon: React.ElementType; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.88rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.55rem" }}>
        <Icon style={{ width: 15, height: 15, color: "var(--brand)" }} /> {title}
        {count !== undefined && <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", background: "var(--secondary)", borderRadius: 999, padding: "0.03rem 0.45rem" }}>{count}</span>}
      </h3>
      {children}
    </div>
  );
}

function ListBlock({ icon, title, items, tone = "default" }: { icon: React.ElementType; title: string; items: string[]; tone?: "default" | "warning" | "brand" }) {
  const dot = tone === "warning" ? "var(--warning)" : tone === "brand" ? "var(--brand)" : "var(--text-muted)";
  return (
    <Block icon={icon} title={title} count={items.length}>
      {items.length ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {items.map((it, i) => (
            <li key={i} style={{ fontSize: "0.83rem", color: "var(--text-secondary)", paddingLeft: "0.9rem", position: "relative", lineHeight: 1.45 }}>
              <span style={{ position: "absolute", left: 0, top: "0.5rem", width: 5, height: 5, borderRadius: "50%", background: dot }} />
              {it}
            </li>
          ))}
        </ul>
      ) : <Empty>—</Empty>}
    </Block>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{children}</p>;
}
