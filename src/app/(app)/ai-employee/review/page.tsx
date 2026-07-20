"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { CASE_TYPE_LABELS } from "@/lib/constants";

type Item = { id: string; name: string; caseType: string; conflictStatus: string; score: number | null; summary: string | null };

export default function ReviewQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/ai-employee/board");
        const json = await res.json();
        if (json.success) setItems(json.data.columns.reviewQueue);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--brand)" }} /></div>;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.25rem" }}>
        <ShieldCheck style={{ width: 24, height: 24, color: "var(--warning)" }} />
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)" }}>Review Queue</h1>
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        The attorney sign-off gate. Nothing the AI produces proceeds past a flagged conflict until a lawyer reviews and clears it.
      </p>

      {items.length === 0 ? (
        <div className="lf-card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
          Queue is clear — no conflicts awaiting attorney sign-off.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {items.map((it) => (
            <div key={it.id} onClick={() => router.push(`/leads/${it.id}`)} className="lf-card"
              style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--navy)" }}>{it.name}</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--warning)", background: "var(--warning-bg)", padding: "0.12rem 0.5rem", borderRadius: 999 }}>
                    {it.conflictStatus === "CONFLICT" ? "Conflict" : "Potential conflict"}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{CASE_TYPE_LABELS[it.caseType] || it.caseType}</div>
                {it.summary && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.summary}</p>}
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.82rem", fontWeight: 600, color: "var(--brand)", whiteSpace: "nowrap" }}>
                Review <ArrowRight style={{ width: 14, height: 14 }} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
