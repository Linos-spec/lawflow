"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Mail,
  ClipboardList,
  Gavel,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const templates = [
  {
    id: "demand_letter",
    label: "Demand Letter",
    description: "Formal letter demanding action or payment from the opposing party",
    icon: Mail,
  },
  {
    id: "client_memo",
    label: "Client Memo",
    description: "Internal memorandum summarizing case status and recommendations",
    icon: ClipboardList,
  },
  {
    id: "case_summary",
    label: "Case Summary Report",
    description: "Comprehensive report covering all aspects of the case",
    icon: FileText,
  },
  {
    id: "motion_draft",
    label: "Motion Draft",
    description: "Draft motion document with standard legal formatting",
    icon: Gavel,
  },
];

export default function DraftPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const hasContent = completion.length > 0;

  async function generate(templateId: string) {
    setIsLoading(true); setError(null); setNotConfigured(false); setCompletion("");
    try {
      const res = await fetch("/api/v1/ai/draft", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId, templateType: templateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503 && json.notConfigured) { setNotConfigured(true); return; }
      if (!res.ok) { setError(json.error || "Failed to generate document."); return; }
      setCompletion(json.document || "");
    } catch {
      setError("Couldn't reach the AI service. Please try again.");
    } finally { setIsLoading(false); }
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplate(templateId);
    generate(templateId);
  }

  async function handleCopy() {
    const text = textareaRef.current?.value || completion;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const text = textareaRef.current?.value || completion;
    const templateLabel =
      templates.find((t) => t.id === selectedTemplate)?.label || "Document";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateLabel.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/cases/${caseId}`}
            className="lf-btn lf-btn-ghost"
            style={{ padding: "0.375rem" }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles style={{ width: 20, height: 20, color: "var(--gold)" }} />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--navy)",
                }}
              >
                AI Document Drafting
              </h1>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Generate legal documents from case data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Template selector */}
      {!selectedTemplate && (
        <div>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--navy)" }}
          >
            Select a document template:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  className="lf-card-interactive text-left"
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                      style={{
                        background: "rgba(196,154,46,0.12)",
                        color: "var(--gold)",
                      }}
                    >
                      <Icon style={{ width: 20, height: 20 }} />
                    </div>
                    <div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--navy)" }}
                      >
                        {t.label}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated content */}
      {selectedTemplate && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setCompletion("");
                }}
                className="lf-btn lf-btn-outline"
                style={{ fontSize: "0.8125rem" }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Change Template
              </button>
              <span
                className="lf-badge"
                style={{
                  background: "rgba(196,154,46,0.12)",
                  color: "var(--gold)",
                }}
              >
                <Sparkles style={{ width: 12, height: 12 }} />
                {templates.find((t) => t.id === selectedTemplate)?.label}
              </span>
            </div>
            {hasContent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedTemplate && generate(selectedTemplate)}
                  disabled={isLoading}
                  className="lf-btn lf-btn-outline"
                  style={{ fontSize: "0.8125rem" }}
                >
                  <RefreshCw
                    style={{
                      width: 14,
                      height: 14,
                      animation: isLoading
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="lf-btn lf-btn-outline"
                  style={{ fontSize: "0.8125rem" }}
                >
                  {copied ? (
                    <Check
                      style={{ width: 14, height: 14, color: "var(--success)" }}
                    />
                  ) : (
                    <Copy style={{ width: 14, height: 14 }} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="lf-btn lf-btn-gold"
                  style={{ fontSize: "0.8125rem" }}
                >
                  <Download style={{ width: 14, height: 14 }} />
                  Download
                </button>
              </div>
            )}
          </div>

          {/* Document output */}
          <div className="lf-ai-card">
            {notConfigured && !isLoading && (
              <div className="text-sm rounded-lg p-3" style={{ background: "var(--warning-bg)", color: "#92400e" }}>
                <div className="flex items-center gap-1.5 font-semibold mb-1"><AlertTriangle style={{ width: 14, height: 14 }} /> AI isn&apos;t configured yet</div>
                Add an <code>ANTHROPIC_API_KEY</code> in your deployment settings to turn on AI drafting.
              </div>
            )}
            {error && !isLoading && (
              <div className="text-sm rounded-lg p-3 flex items-center justify-between gap-2" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                <span>{error}</span>
                <button onClick={() => selectedTemplate && generate(selectedTemplate)} className="underline" style={{ fontWeight: 600 }}>Retry</button>
              </div>
            )}
            {isLoading && !hasContent && (
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles
                    style={{
                      width: 16,
                      height: 16,
                      color: "var(--gold)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--gold)" }}
                  >
                    Generating document...
                  </span>
                </div>
                <div className="lf-ai-shimmer" style={{ height: 16, width: "85%" }} />
                <div className="lf-ai-shimmer" style={{ height: 16, width: "70%" }} />
                <div className="lf-ai-shimmer" style={{ height: 16, width: "90%" }} />
                <div className="lf-ai-shimmer" style={{ height: 16, width: "55%" }} />
                <div className="lf-ai-shimmer" style={{ height: 16, width: "80%" }} />
              </div>
            )}
            {(hasContent || (isLoading && hasContent)) && (
              <textarea
                ref={textareaRef}
                value={completion}
                onChange={(e) => setCompletion(e.target.value)}
                className="w-full border-none bg-transparent text-sm leading-relaxed focus:outline-none resize-none"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "'Inter', sans-serif",
                  minHeight: "500px",
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
