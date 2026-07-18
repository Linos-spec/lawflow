"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, Phone, UserCheck, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CASE_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { conflictBadge, STAGES, STAGE_LABELS } from "@/lib/lead-badges";

interface ConflictMatch {
  type: string; id: string; name: string; matchedOn: string; role: string; score: number; reason: string;
}
interface ConflictCheck {
  id: string; status: string; searchedNames: string[]; matches: ConflictMatch[]; matchCount: number; createdAt: string;
}
interface LeadDetail {
  id: string; name: string; email: string | null; phone: string | null; source: string; stage: string;
  caseType: string; description: string | null; adverseParties: string[];
  qualified: boolean | null; qualificationScore: number | null; aiPriority: string | null;
  aiSummary: string | null; aiRiskFlags: string[]; aiNextSteps: string[];
  conflictStatus: string; convertedClientId: string | null; createdAt: string;
  conflictChecks: ConflictCheck[];
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/v1/leads/${id}`);
      const json = await res.json();
      if (json.success) setLead(json.data);
      else toast.error("Lead not found");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Update failed"); return; }
      toast.success(msg);
      await load();
    } finally { setBusy(false); }
  };

  const convert = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leads/${id}/convert`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Conversion failed"); return; }
      toast.success("Converted to client");
      router.push(`/clients`);
    } finally { setBusy(false); }
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>;
  if (!lead) return <div style={{ padding: "2rem" }}>Lead not found. <Link href="/leads" style={{ color: "var(--gold)" }}>Back to leads</Link></div>;

  const cb = conflictBadge(lead.conflictStatus);
  const latestCheck = lead.conflictChecks?.[0];

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <Link href="/leads" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem", textDecoration: "none" }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to leads
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)" }}>{lead.name}</h1>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {lead.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Mail style={{ width: 14, height: 14 }} /> {lead.email}</span>}
            {lead.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Phone style={{ width: 14, height: 14 }} /> {lead.phone}</span>}
            <span>{CASE_TYPE_LABELS[lead.caseType] || lead.caseType}</span>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: cb.bg, color: cb.text, borderRadius: 999, padding: "0.375rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600 }}>
          <cb.Icon style={{ width: 15, height: 15 }} /> Conflict: {cb.label}
        </span>
      </div>

      {/* Actions */}
      <div className="lf-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Stage</label>
          <select className="lf-input" value={lead.stage} disabled={busy} onChange={(e) => patch({ stage: e.target.value }, "Stage updated")} style={{ width: "auto", padding: "0.5rem 0.75rem" }}>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        {lead.conflictStatus === "CONFLICT" && (
          <button onClick={() => patch({ conflictStatus: "WAIVED" }, "Conflict waived (attorney review)")} disabled={busy} className="lf-btn" style={{ padding: "0.625rem 1rem", background: "var(--warning-bg, #fbf1e0)", color: "var(--warning, #b7791f)" }}>
            <AlertTriangle style={{ width: 16, height: 16 }} /> Waive conflict
          </button>
        )}
        {lead.convertedClientId ? (
          <Link href="/clients" className="lf-btn" style={{ padding: "0.625rem 1rem", background: "var(--bg-base)", color: "var(--navy)" }}>
            <UserCheck style={{ width: 16, height: 16 }} /> View client
          </Link>
        ) : (
          <button onClick={convert} disabled={busy || lead.conflictStatus === "CONFLICT"} className="lf-btn lf-btn-gold" style={{ padding: "0.625rem 1.25rem", opacity: lead.conflictStatus === "CONFLICT" ? 0.5 : 1 }}
            title={lead.conflictStatus === "CONFLICT" ? "Resolve the conflict before converting" : ""}>
            <UserCheck style={{ width: 16, height: 16 }} /> Convert to client
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* AI Qualification */}
        <div className="lf-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1rem" }}>
            <Sparkles style={{ width: 18, height: 18, color: "var(--gold)" }} /> AI Qualification
          </h3>
          {lead.qualificationScore == null ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Not yet qualified. (AI qualification runs automatically when an OpenAI key is configured.)
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Score</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: lead.qualificationScore >= 70 ? "var(--success, #2e7d5b)" : lead.qualificationScore >= 40 ? "var(--warning, #b7791f)" : "var(--text-secondary)" }}>{lead.qualificationScore}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Priority</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginTop: "0.5rem" }}>{lead.aiPriority ? PRIORITY_LABELS[lead.aiPriority] : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Qualified</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: lead.qualified ? "var(--success, #2e7d5b)" : "var(--text-secondary)", marginTop: "0.5rem" }}>{lead.qualified ? "Yes" : "No"}</div>
                </div>
              </div>
              {lead.aiSummary && <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{lead.aiSummary}</p>}
              {lead.aiRiskFlags?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Risk flags</div>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{lead.aiRiskFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
              {lead.aiNextSteps?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Recommended next steps</div>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{lead.aiNextSteps.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conflict check */}
        <div className="lf-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1rem" }}>
            <cb.Icon style={{ width: 18, height: 18, color: cb.text }} /> Conflict Check
          </h3>
          {!latestCheck || latestCheck.matchCount === 0 ? (
            <p style={{ color: "var(--success, #2e7d5b)", fontSize: "0.875rem" }}>
              No conflicts found. Searched: {latestCheck?.searchedNames.join(", ") || lead.name}.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {latestCheck.matchCount} potential match{latestCheck.matchCount > 1 ? "es" : ""} — attorney review required.
              </p>
              {latestCheck.matches.map((m, i) => (
                <div key={i} style={{ border: "1px solid var(--border, #e5e0d5)", borderRadius: "var(--radius-sm, 8px)", padding: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.875rem" }}>{m.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{m.type} · {Math.round(m.score * 100)}%</span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{m.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Original inquiry */}
      {lead.description && (
        <div className="lf-card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>Their inquiry</h3>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{lead.description}</p>
          {lead.adverseParties?.length > 0 && (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>Opposing parties: {lead.adverseParties.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
