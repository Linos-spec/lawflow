"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2 } from "lucide-react";
import { CASE_TYPE_LABELS, CASE_STATUS_LABELS } from "@/lib/constants";

interface Similar {
  id: string; caseNumber: string; title: string; caseType: string; status: string;
  clientName: string | null; similarity: number; sharedType: boolean;
}

export function SimilarMatters({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [results, setResults] = useState<Similar[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/similar`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data.results || []);
        setUnavailable(!!json.data.unavailable);
      }
    } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  function bar(pct: number) {
    const c = pct >= 75 ? "var(--success)" : pct >= 55 ? "var(--brand)" : "var(--gold)";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ width: 44, height: 6, borderRadius: 999, background: "var(--bg-base)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: c }} />
        </div>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div className="lf-card" style={{ padding: "1.5rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1rem" }}>
        <Layers style={{ width: 18, height: 18, color: "var(--gold)" }} /> Similar Matters
      </h3>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Searching your firm&apos;s past matters…
        </div>
      ) : unavailable ? (
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Semantic search runs when an OpenAI key is configured.</p>
      ) : results.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No closely similar matters found in your firm&apos;s history yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {results.map((r) => (
            <div key={r.id} onClick={() => router.push(`/cases/${r.id}`)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.6rem 0.7rem", borderRadius: 8, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-base)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  {r.caseNumber} · {CASE_TYPE_LABELS[r.caseType] || r.caseType} · {CASE_STATUS_LABELS[r.status] || r.status}
                  {r.clientName ? ` · ${r.clientName}` : ""}
                </div>
              </div>
              {bar(r.similarity)}
            </div>
          ))}
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Ranked by semantic similarity of the matters&apos; facts — a research aid, not legal advice.</p>
        </div>
      )}
    </div>
  );
}
