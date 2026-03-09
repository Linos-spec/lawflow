"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  CalendarClock,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  PRIORITY_LABELS,
} from "@/lib/constants";

interface DeadlineRecord {
  id: string;
  title: string;
  dueDate: string;
  deadlineType: string;
  status: string;
  priority: string;
  case: { id: string; title: string; caseNumber: string };
}

const priorityStyles: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "var(--danger-bg)", text: "var(--danger)" },
  HIGH: { bg: "var(--danger-bg)", text: "var(--danger)" },
  MEDIUM: { bg: "var(--warning-bg)", text: "var(--warning)" },
  LOW: { bg: "var(--success-bg)", text: "var(--success)" },
};

function isOverdue(dueDate: string, status: string): boolean {
  return status === "PENDING" && new Date(dueDate) < new Date();
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<DeadlineRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeadlines() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/deadlines?limit=50");
        if (!res.ok) throw new Error("Failed to fetch deadlines");
        const json = await res.json();
        if (json.success) {
          setDeadlines(json.data);
        } else {
          throw new Error(json.error || "Failed to fetch deadlines");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load deadlines");
      } finally {
        setLoading(false);
      }
    }
    fetchDeadlines();
  }, []);

  const pending = useMemo(
    () => deadlines.filter((d) => d.status === "PENDING"),
    [deadlines]
  );
  const completed = useMemo(
    () => deadlines.filter((d) => d.status === "COMPLETED"),
    [deadlines]
  );
  const overdueCount = useMemo(
    () => pending.filter((d) => isOverdue(d.dueDate, d.status)).length,
    [pending]
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
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

      {/* Loading state */}
      {loading ? (
        <div className="lf-card">
          <div className="lf-empty">
            <Loader2
              className="lf-empty-icon animate-spin"
              style={{ width: 36, height: 36, color: "var(--navy)" }}
            />
            <p className="lf-empty-title">Loading deadlines...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="lf-card lf-stat-gold">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Pending
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
              >
                {pending.length}
              </p>
            </div>
            <div className="lf-card lf-stat-red">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Overdue
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--danger)" }}
              >
                {overdueCount}
              </p>
            </div>
            <div className="lf-card lf-stat-green">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Completed
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}
              >
                {completed.length}
              </p>
            </div>
          </div>

          {/* Empty state when no deadlines at all */}
          {deadlines.length === 0 ? (
            <div className="lf-card">
              <div className="lf-empty">
                <CalendarClock className="lf-empty-icon" />
                <p className="lf-empty-title">No deadlines yet</p>
                <p className="lf-empty-desc">
                  Create your first deadline to start tracking important dates.
                </p>
                <Link href="/deadlines/new" className="lf-btn lf-btn-gold">
                  <Plus style={{ width: 16, height: 16 }} />
                  Add First Deadline
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Upcoming (pending) deadlines */}
              {pending.length > 0 && (
                <div className="lf-card">
                  <h2
                    className="text-lg font-bold mb-4"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                  >
                    Upcoming
                  </h2>
                  <div className="space-y-2">
                    {pending.map((d) => {
                      const overdue = isOverdue(d.dueDate, d.status);
                      const ps = overdue
                        ? { bg: "var(--danger-bg)", text: "var(--danger)" }
                        : priorityStyles[d.priority] || priorityStyles.MEDIUM;
                      return (
                        <Link
                          key={d.id}
                          href={`/cases/${d.case.id}`}
                          className="flex items-center gap-3 rounded-lg p-3 transition-colors no-underline"
                          style={{
                            background: overdue ? "var(--danger-bg)" : "var(--bg-base)",
                          }}
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                            style={{ background: ps.bg }}
                          >
                            {overdue ? (
                              <AlertTriangle style={{ width: 17, height: 17, color: ps.text }} />
                            ) : d.priority === "HIGH" || d.priority === "URGENT" ? (
                              <AlertCircle style={{ width: 17, height: 17, color: ps.text }} />
                            ) : d.priority === "MEDIUM" ? (
                              <Clock style={{ width: 17, height: 17, color: ps.text }} />
                            ) : (
                              <CalendarClock style={{ width: 17, height: 17, color: ps.text }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: overdue ? "var(--danger)" : "var(--navy)" }}
                            >
                              {d.title}
                              {overdue && (
                                <span
                                  className="ml-2 text-xs font-medium"
                                  style={{ color: "var(--danger)" }}
                                >
                                  OVERDUE
                                </span>
                              )}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {d.case.title} &middot; {d.case.caseNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="lf-badge"
                              style={{ background: ps.bg, color: ps.text }}
                            >
                              {PRIORITY_LABELS[d.priority] || d.priority}
                            </span>
                            <span
                              className="text-sm font-medium"
                              style={{
                                color: overdue ? "var(--danger)" : "var(--text-secondary)",
                              }}
                            >
                              {formatDate(d.dueDate)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

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
                          <CheckCircle2
                            style={{ width: 17, height: 17, color: "var(--success)" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold line-through"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {d.title}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {d.case.title} &middot; {formatDate(d.dueDate)}
                          </p>
                        </div>
                        <span className="lf-badge lf-badge-green">Completed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
