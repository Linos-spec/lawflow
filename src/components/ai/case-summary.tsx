"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

export function CaseSummary({ caseId }: { caseId: string }) {
  const [expanded, setExpanded] = useState(true);

  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/v1/ai/summarize",
    body: { caseId },
  });

  const hasContent = completion.length > 0;

  return (
    <div className="lf-ai-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles
            style={{ width: 16, height: 16, color: "var(--gold)" }}
          />
          <h2
            className="text-base font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--navy)",
            }}
          >
            AI Summary
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {hasContent && (
            <button
              onClick={() => complete("")}
              disabled={isLoading}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              title="Regenerate"
            >
              <RefreshCw
                style={{
                  width: 14,
                  height: 14,
                  animation: isLoading ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          )}
          {hasContent && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {expanded ? (
                <ChevronUp style={{ width: 14, height: 14 }} />
              ) : (
                <ChevronDown style={{ width: 14, height: 14 }} />
              )}
            </button>
          )}
        </div>
      </div>

      {!hasContent && !isLoading && !error && (
        <div className="text-center py-2">
          <p
            className="text-xs mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Generate a concise case brief with AI
          </p>
          <button
            onClick={() => complete("")}
            className="lf-btn lf-btn-gold"
            style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            Summarize Case
          </button>
        </div>
      )}

      {isLoading && !hasContent && (
        <div className="space-y-2">
          <div className="lf-ai-shimmer" style={{ height: 14, width: "90%" }} />
          <div className="lf-ai-shimmer" style={{ height: 14, width: "75%" }} />
          <div className="lf-ai-shimmer" style={{ height: 14, width: "85%" }} />
          <div className="lf-ai-shimmer" style={{ height: 14, width: "60%" }} />
        </div>
      )}

      {error && (
        <div
          className="text-sm rounded-lg p-3"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          Failed to generate summary. Please try again.
        </div>
      )}

      {hasContent && expanded && (
        <div
          className="text-sm leading-relaxed prose-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {completion.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h3
                  key={i}
                  className="text-sm font-bold mt-3 mb-1"
                  style={{ color: "var(--navy)" }}
                >
                  {line.replace("## ", "")}
                </h3>
              );
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <p key={i} className="ml-3 mb-0.5" style={{ textIndent: "-0.75rem", paddingLeft: "0.75rem" }}>
                  {line}
                </p>
              );
            }
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="mb-1">{line}</p>;
          })}
          {isLoading && (
            <span
              className="inline-block w-2 h-4 ml-0.5"
              style={{
                background: "var(--gold)",
                animation: "pulse 1s ease-in-out infinite",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
