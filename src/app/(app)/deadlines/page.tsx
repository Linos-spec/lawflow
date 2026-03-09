"use client";

import Link from "next/link";
import {
  CalendarClock,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Shared deadline data — same source used on dashboard
const deadlines = [
  {
    id: "1",
    title: "File Motion to Dismiss",
    caseName: "Martinez v. Acme Corp",
    caseNumber: "LF-2024-001",
    dueDate: "Mar 15, 2026",
    type: "Filing",
    priority: "High" as const,
    status: "Pending" as const,
  },
  {
    id: "2",
    title: "Discovery Response Due",
    caseName: "Johnson Estate Planning",
    caseNumber: "LF-2024-002",
    dueDate: "Mar 18, 2026",
    type: "Discovery",
    priority: "High" as const,
    status: "Pending" as const,
  },
  {
    id: "3",
    title: "Client Meeting Prep",
    caseName: "Thompson Divorce",
    caseNumber: "LF-2024-003",
    dueDate: "Mar 22, 2026",
    type: "Client Meeting",
    priority: "Medium" as const,
    status: "Pending" as const,
  },
  {
    id: "4",
    title: "Annual Filing Deadline",
    caseName: "Roberts LLC Formation",
    caseNumber: "LF-2024-004",
    dueDate: "Apr 5, 2026",
    type: "Filing",
    priority: "Low" as const,
    status: "Pending" as const,
  },
  {
    id: "5",
    title: "File Preliminary Report",
    caseName: "Martinez v. Acme Corp",
    caseNumber: "LF-2024-001",
    dueDate: "Mar 5, 2026",
    type: "Filing",
    priority: "High" as const,
    status: "Completed" as const,
  },
];

const priorityStyles: Record<string, { bg: string; text: string }> = {
  High: { bg: "var(--danger-bg)", text: "var(--danger)" },
  Medium: { bg: "var(--warning-bg)", text: "var(--warning)" },
  Low: { bg: "var(--success-bg)", text: "var(--success)" },
};

export default function DeadlinesPage() {
  const pending = deadlines.filter((d) => d.status === "Pending");
  const completed = deadlines.filter((d) => d.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
            >
              Deadlines
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Track important dates and filing deadlines
            </p>
          </div>
          <Link href="/deadlines/new" className="lf-btn lf-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            New Deadline
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="lf-card lf-stat-gold">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Pending</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
            {pending.length}
          </p>
        </div>
        <div className="lf-card lf-stat-red">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Overdue</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-heading)", color: "var(--danger)" }}>
            0
          </p>
        </div>
        <div className="lf-card lf-stat-green">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Completed</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}>
            {completed.length}
          </p>
        </div>
      </div>

      {/* Pending deadlines */}
      <div className="lf-card">
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Upcoming
        </h2>
        <div className="space-y-2">
          {pending.map((d) => {
            const ps = priorityStyles[d.priority];
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                style={{ background: "var(--bg-base)" }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: ps.bg }}
                >
                  {d.priority === "High" ? (
                    <AlertCircle style={{ width: 17, height: 17, color: ps.text }} />
                  ) : d.priority === "Medium" ? (
                    <Clock style={{ width: 17, height: 17, color: ps.text }} />
                  ) : (
                    <CalendarClock style={{ width: 17, height: 17, color: ps.text }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                    {d.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {d.caseName} &middot; {d.caseNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="lf-badge" style={{ background: ps.bg, color: ps.text }}>
                    {d.priority}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {d.dueDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed deadlines */}
      {completed.length > 0 && (
        <div className="lf-card">
          <h2
            className="text-lg font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
          >
            Completed
          </h2>
          <div className="space-y-2">
            {completed.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg p-3"
                style={{ background: "var(--bg-base)", opacity: 0.7 }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: "var(--success-bg)" }}
                >
                  <CheckCircle2 style={{ width: 17, height: 17, color: "var(--success)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-through" style={{ color: "var(--text-secondary)" }}>
                    {d.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {d.caseName} &middot; {d.dueDate}
                  </p>
                </div>
                <span className="lf-badge lf-badge-green">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
