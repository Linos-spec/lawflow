"use client";

import { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { IntakeAnalysis } from "@/lib/validators/ai.schema";

const priorityStyles: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "var(--danger-bg)", text: "var(--danger)" },
  URGENT: { bg: "var(--danger-bg)", text: "var(--danger)" },
  MEDIUM: { bg: "var(--warning-bg)", text: "var(--warning)" },
  LOW: { bg: "var(--success-bg)", text: "var(--success)" },
};

const caseTypeLabels: Record<string, string> = {
  CIVIL: "Civil",
  CRIMINAL: "Criminal",
  FAMILY: "Family",
  CORPORATE: "Corporate",
  IMMIGRATION: "Immigration",
  REAL_ESTATE: "Real Estate",
  BANKRUPTCY: "Bankruptcy",
  PERSONAL_INJURY: "Personal Injury",
  OTHER: "Other",
};

export function IntakeAnalysisButton({
  intakeId,
}: {
  intakeId: string;
}) {
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/analyze-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeId }),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const json = await res.json();
      if (json.success) {
        setAnalysis(json.data);
        setShowPanel(true);
      } else {
        throw new Error(json.error);
      }
    } catch {
      toast.error("Failed to analyze intake form");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="p-1.5 rounded-md transition-colors"
        style={{ color: "var(--gold)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(196,154,46,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
        title="Analyze with AI"
      >
        <Sparkles
          style={{
            width: 16,
            height: 16,
            animation: loading ? "pulse 1.5s ease-in-out infinite" : "none",
          }}
        />
      </button>

      {/* Analysis modal */}
      {showPanel && analysis && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 60, background: "rgba(15,27,51,0.5)" }}
          onClick={() => setShowPanel(false)}
        >
          <div
            className="lf-ai-card w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles
                  style={{ width: 18, height: 18, color: "var(--gold)" }}
                />
                <h3
                  className="text-base font-bold"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--navy)",
                  }}
                >
                  AI Intake Analysis
                </h3>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 rounded-md"
                style={{ color: "var(--text-muted)" }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Summary */}
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {analysis.summary}
            </p>

            {/* Badges row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className="lf-badge"
                style={{
                  background: "rgba(196,154,46,0.12)",
                  color: "var(--gold)",
                }}
              >
                {caseTypeLabels[analysis.suggestedCaseType] ||
                  analysis.suggestedCaseType}
              </span>
              <span
                className="lf-badge"
                style={{
                  background: (priorityStyles[analysis.estimatedPriority] || priorityStyles.MEDIUM).bg,
                  color: (priorityStyles[analysis.estimatedPriority] || priorityStyles.MEDIUM).text,
                }}
              >
                {analysis.estimatedPriority} Priority
              </span>
              {analysis.conflictCheckNeeded && (
                <span
                  className="lf-badge"
                  style={{
                    background: "var(--warning-bg)",
                    color: "var(--warning)",
                  }}
                >
                  <Shield style={{ width: 12, height: 12 }} />
                  Conflict Check Needed
                </span>
              )}
            </div>

            {/* Risk flags */}
            {analysis.riskFlags.length > 0 && (
              <div className="mb-4">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--danger)" }}
                >
                  Risk Flags
                </p>
                <div className="space-y-1.5">
                  {analysis.riskFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm rounded-lg p-2"
                      style={{
                        background: "var(--danger-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <AlertTriangle
                        style={{
                          width: 14,
                          height: 14,
                          color: "var(--danger)",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended steps */}
            {analysis.recommendedSteps.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--success)" }}
                >
                  Recommended Next Steps
                </p>
                <div className="space-y-1.5">
                  {analysis.recommendedSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm rounded-lg p-2"
                      style={{
                        background: "var(--success-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                        {i === analysis.recommendedSteps.length - 1 ? (
                          <CheckCircle2
                            style={{
                              width: 14,
                              height: 14,
                              color: "var(--success)",
                            }}
                          />
                        ) : (
                          <ArrowRight
                            style={{
                              width: 14,
                              height: 14,
                              color: "var(--success)",
                            }}
                          />
                        )}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
