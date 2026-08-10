"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, AlertTriangle } from "lucide-react";

export function CaseSummary({ caseId }: { caseId: string }) {
  const [expanded, setExpanded] = useState(true);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const run = async () => {
    setLoading(true); setError(null); setNotConfigured(false);
    try {
      const res = await fetch("/api/v1/ai/summarize", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.notConfigured) { setNotConfigured(true); return; }
      if (json.aiError || !res.ok || !json.summary) { setError(json.error || "Failed to generate summary."); return; }
      setSummary(json.summary);
      setExpanded(true);
    } catch {
      setError("Couldn't reach the AI service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasContent = summary.length > 0;

  return (
    <div className="lf-ai-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 16, height: 16, color: "var(--gold)" }} />
          <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>AI Summary</h2>
        </div>
        {hasContent && (
          <div className="flex items-center gap-1">
            <button onClick={run} disabled={loading} className="p-1.5 rounded-md" style={{ color: "var(--text-muted)" }} title="Regenerate">
              <RefreshCw style={{ width: 14, height: 14, animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-md" style={{ color: "var(--text-muted)" }}>
              {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        )}
      </div>

      {/* Idle */}
      {!hasContent && !loading && !error && !notConfigured && (
        <div className="text-center py-2">
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Generate a concise case brief with AI</p>
          <button onClick={run} className="lf-btn lf-btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
            <Sparkles style={{ width: 14, height: 14 }} /> Summarize Case
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          <div className="lf-ai-shimmer" style={{ height: 14, width: "90%" }} />
          <div className="lf-ai-shimmer" style={{ height: 14, width: "75%" }} />
          <div className="lf-ai-shimmer" style={{ height: 14, width: "85%" }} />
          <div className="lf-ai-shimmer" style={{ height: 14, width: "60%" }} />
        </div>
      )}

      {/* Not configured — honest, not silent */}
      {notConfigured && !loading && (
        <div className="text-sm rounded-lg p-3" style={{ background: "var(--warning-bg)", color: "#92400e" }}>
          <div className="flex items-center gap-1.5 font-semibold mb-1"><AlertTriangle style={{ width: 14, height: 14 }} /> AI isn&apos;t configured yet</div>
          Add an <code>ANTHROPIC_API_KEY</code> in your deployment settings to turn on AI summaries.
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-sm rounded-lg p-3 flex items-center justify-between gap-2" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          <span>{error}</span>
          <button onClick={run} className="underline" style={{ fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Result */}
      {hasContent && expanded && (
        <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {summary.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <h3 key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: "var(--navy)" }}>{line.replace("## ", "")}</h3>;
            if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} className="ml-3 mb-0.5" style={{ textIndent: "-0.75rem", paddingLeft: "0.75rem" }}>{line}</p>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="mb-1">{line}</p>;
          })}
        </div>
      )}
    </div>
  );
}
