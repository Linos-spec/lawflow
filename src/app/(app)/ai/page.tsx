"use client";

import Link from "next/link";
import {
  Sparkles,
  FileText,
  MessageSquare,
  ClipboardList,
  Briefcase,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "Case Summarizer",
    description:
      "Generate a concise AI-powered brief for any case, covering status, deadlines, billing, and recommendations.",
    icon: Briefcase,
    action: "Open any case to summarize",
    href: "/cases",
    color: "var(--gold)",
  },
  {
    title: "Document Drafting",
    description:
      "Generate demand letters, client memos, case summary reports, and motion drafts from case data.",
    icon: FileText,
    action: "Open any case to draft documents",
    href: "/cases",
    color: "var(--info)",
  },
  {
    title: "Chat Assistant",
    description:
      "Ask natural language questions about your cases, deadlines, and billing. Available from any page via the floating button.",
    icon: MessageSquare,
    action: "Click the chat button in the bottom right",
    href: null,
    color: "var(--success)",
  },
  {
    title: "Intake Analyzer",
    description:
      "Analyze intake forms with AI to get suggested case types, priority levels, risk flags, and recommended next steps.",
    icon: ClipboardList,
    action: "Go to Intake Forms to analyze",
    href: "/intake",
    color: "var(--warning)",
  },
];

export default function AiPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles style={{ width: 24, height: 24, color: "var(--gold)" }} />
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              AI Assistant
            </h1>
          </div>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Powered by AI to help you work smarter and faster
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const content = (
            <div className="lf-ai-card h-full flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${feature.color} 12%, transparent)`,
                    color: feature.color,
                  }}
                >
                  <Icon style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <h2
                    className="font-bold text-base"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--navy)",
                    }}
                  >
                    {feature.title}
                  </h2>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed mb-4 flex-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {feature.description}
              </p>
              <div
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--gold)" }}
              >
                {feature.action}
                {feature.href && (
                  <ArrowRight style={{ width: 12, height: 12 }} />
                )}
              </div>
            </div>
          );

          return feature.href ? (
            <Link
              key={feature.title}
              href={feature.href}
              style={{ textDecoration: "none" }}
            >
              {content}
            </Link>
          ) : (
            <div key={feature.title}>{content}</div>
          );
        })}
      </div>

      {/* Info card */}
      <div
        className="lf-card"
        style={{
          background: "var(--navy)",
          color: "white",
        }}
      >
        <div className="flex items-start gap-3">
          <Sparkles
            style={{ width: 20, height: 20, color: "var(--gold-light)", flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <p className="font-semibold text-sm mb-1">AI-Powered Insights</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              LawFlow AI features analyze your firm&apos;s data to provide summaries, draft documents,
              and answer questions. All AI processing is secure and your data never leaves your firm&apos;s context.
              Use the floating chat button (bottom-right) to ask questions from any page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
