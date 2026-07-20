"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Bot, Inbox, Sparkles, ShieldCheck, FileText, Briefcase, ArrowRight } from "lucide-react";
import { CASE_TYPE_LABELS } from "@/lib/constants";

type Item = { id: string; name: string; caseType: string; conflictStatus: string; score: number | null; priority: string | null; summary: string | null };
interface Board {
  stats: { intake: number; analysis: number; reviewQueue: number; activeCases: number; openDeadlines: number; pendingDocs: number };
  columns: { intake: Item[]; analysis: Item[]; engaged: Item[]; reviewQueue: Item[] };
}

// The pipeline, in flow order, with each stage's automation status today.
const FLOW: { label: string; status: "live" | "partial" | "new" }[] = [
  { label: "Intake", status: "live" },
  { label: "Analysis", status: "live" },
  { label: "Matter Creation", status: "partial" },
  { label: "Document AI", status: "live" },
  { label: "Research AI", status: "new" },
  { label: "Tasks & Deadlines", status: "partial" },
  { label: "Billing", status: "partial" },
  { label: "Attorney Review", status: "live" },
  { label: "Send / File / Close", status: "partial" },
];
const STATUS_STYLE: Record<string, { c: string; bg: string; label: string }> = {
  live: { c: "var(--success)", bg: "var(--success-bg)", label: "Live" },
  partial: { c: "var(--warning)", bg: "var(--warning-bg)", label: "Partial" },
  new: { c: "var(--text-muted)", bg: "var(--secondary)", label: "Soon" },
};

export default function AiEmployeePage() {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/ai-employee/board");
        const json = await res.json();
        if (json.success) setBoard(json.data);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--brand)" }} /></div>;

  const s = board?.stats;
  const stats = [
    { label: "In intake", value: s?.intake ?? 0, icon: Inbox, color: "var(--brand)" },
    { label: "Awaiting review", value: s?.reviewQueue ?? 0, icon: ShieldCheck, color: (s?.reviewQueue ?? 0) > 0 ? "var(--warning)" : "var(--success)" },
    { label: "Active matters", value: s?.activeCases ?? 0, icon: Briefcase, color: "var(--navy)" },
    { label: "Docs to sign", value: s?.pendingDocs ?? 0, icon: FileText, color: "var(--brand)" },
  ];

  return (
    <div style={{ padding: "0.5rem 0", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "0.9rem", alignItems: "center", marginBottom: "0.35rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot style={{ width: 22, height: 22, color: "#fff" }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.1 }}>AI Employee</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Your opt-in AI workspace — intake to close, with an attorney sign-off gate.</p>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", margin: "1.25rem 0" }}>
        {stats.map((st) => (
          <div key={st.label} className="lf-card" style={{ padding: "0.9rem 1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
              <st.icon style={{ width: 14, height: 14, color: st.color }} /> {st.label}
            </div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--navy)", marginTop: 2, fontFamily: "var(--font-heading)" }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline flow */}
      <div className="lf-card" style={{ padding: "1.15rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.75rem" }}>Pipeline</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {FLOW.map((f, i) => {
            const st = STATUS_STYLE[f.status];
            return (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ padding: "0.5rem 0.7rem", borderRadius: 9, background: st.bg, border: `1px solid ${st.c}22`, minWidth: 92 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--navy)", whiteSpace: "nowrap" }}>{f.label}</div>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: st.c }}>{st.label}</div>
                </div>
                {i < FLOW.length - 1 && <ArrowRight style={{ width: 13, height: 13, color: "var(--text-muted)", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live queues */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <Queue
          title="Intake & analysis" icon={Sparkles} accent="var(--brand)"
          items={[...(board?.columns.intake ?? []), ...(board?.columns.analysis ?? [])]}
          empty="No new inquiries. New intakes land here automatically."
          onOpen={(id) => router.push(`/leads/${id}`)}
        />
        <Queue
          title="Attorney review queue" icon={ShieldCheck} accent="var(--warning)"
          badge="Sign-off gate"
          items={board?.columns.reviewQueue ?? []}
          empty="Nothing awaiting review. Conflict-flagged intakes appear here for attorney sign-off."
          onOpen={(id) => router.push(`/leads/${id}`)}
        />
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "1.25rem", display: "flex", alignItems: "center", gap: 6 }}>
        <Bot style={{ width: 13, height: 13 }} />
        Live stages run automatically; partial stages still need a lawyer. Manage availability in{" "}
        <Link href="/settings" style={{ color: "var(--brand)" }}>Settings → AI Employee</Link>.
      </p>
    </div>
  );
}

function Queue({ title, icon: Icon, accent, badge, items, empty, onOpen }: {
  title: string; icon: React.ElementType; accent: string; badge?: string;
  items: Item[]; empty: string; onOpen: (id: string) => void;
}) {
  return (
    <div className="lf-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.9rem" }}>
        <Icon style={{ width: 17, height: 17, color: accent }} /> {title}
        {badge && <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: accent, background: "var(--warning-bg)", padding: "0.12rem 0.5rem", borderRadius: 999 }}>{badge}</span>}
        <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", background: "var(--secondary)", borderRadius: 999, padding: "0.05rem 0.5rem" }}>{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{empty}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((it) => (
            <div key={it.id} onClick={() => onOpen(it.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.55rem 0.5rem", borderRadius: 8, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{CASE_TYPE_LABELS[it.caseType] || it.caseType}{it.score != null ? ` · score ${it.score}` : ""}</div>
              </div>
              {(it.conflictStatus === "POTENTIAL" || it.conflictStatus === "CONFLICT") && (
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--warning)", background: "var(--warning-bg)", padding: "0.12rem 0.5rem", borderRadius: 999, whiteSpace: "nowrap" }}>Conflict</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
