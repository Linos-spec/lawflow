"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  AlertTriangle,
  DollarSign,
  Plus,
  UserPlus,
  Clock,
  FileText,
  FileSignature,
  FolderOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface CaseRecord {
  id: string;
  status: string;
  title: string;
  caseNumber: string;
  client: { id: string; name: string };
}

interface DeadlineRecord {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  case: { id: string; title: string; caseNumber: string };
}

interface BillingRecord {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
}

// Quick actions — neutral navigational shortcuts (New Case lives in the header,
// so it isn't duplicated here). One neutral icon color per the color system.
const quickActions = [
  { label: "Add Client", icon: UserPlus, href: "/clients/new" },
  { label: "Upload Document", icon: FolderOpen, href: "/documents" },
  { label: "Set Deadline", icon: Clock, href: "/deadlines/new" },
  { label: "New Invoice", icon: FileText, href: "/billing/new" },
];

const urgencyStyles: Record<string, { bg: string; text: string; label: string }> = {
  HIGH: { bg: "var(--danger-bg)", text: "var(--danger)", label: "High" },
  URGENT: { bg: "var(--danger-bg)", text: "var(--danger)", label: "Urgent" },
  MEDIUM: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Medium" },
  LOW: { bg: "var(--success-bg)", text: "var(--success)", label: "Low" },
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "var(--info)",
  ACTIVE: "var(--navy)",
  ON_HOLD: "var(--text-muted)",
  PENDING: "var(--gold)",
  CLOSED: "var(--text-secondary)",
  ARCHIVED: "#64748b",
};

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRelativeDate(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Counselor";

  // Hydration-safe greeting and date
  const [greeting, setGreeting] = useState("Welcome");
  const [dateStr, setDateStr] = useState("");

  // Data state
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineRecord[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [pendingSigCount, setPendingSigCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hydration-safe: set greeting and date only on client
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Fetch real data from APIs
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [casesRes, deadlinesRes, billingRes, sigRes] = await Promise.all([
          fetch("/api/v1/cases?limit=100"),
          fetch("/api/v1/deadlines?limit=100"),
          fetch("/api/v1/billing?limit=100"),
          fetch("/api/v1/documents?signature=PENDING"),
        ]);

        const [casesJson, deadlinesJson, billingJson, sigJson] = await Promise.all([
          casesRes.json(),
          deadlinesRes.json(),
          billingRes.json(),
          sigRes.json(),
        ]);

        if (casesJson.success) setCases(casesJson.data);
        if (deadlinesJson.success) setDeadlines(deadlinesJson.data);
        if (billingJson.success) setBillingRecords(billingJson.data);
        if (sigJson.success) setPendingSigCount(Array.isArray(sigJson.data) ? sigJson.data.length : 0);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Compute stats from real data
  const activeCases = cases.filter(
    (c) => c.status === "ACTIVE" || c.status === "OPEN"
  ).length;

  const pendingDeadlines = deadlines.filter(
    (d) => d.status === "PENDING"
  ).length;

  const overdueDeadlines = deadlines.filter(
    (d) => d.status === "OVERDUE"
  ).length;

  const unpaidInvoices = billingRecords.filter((b) =>
    ["UNPAID", "OUTSTANDING", "OVERDUE"].includes(b.paymentStatus)
  );
  const unpaidCount = unpaidInvoices.length;
  const outstandingRevenue = unpaidInvoices.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  // Upcoming deadlines: PENDING sorted by dueDate asc, first 4
  const upcomingDeadlines = deadlines
    .filter((d) => d.status === "PENDING")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 4);

  // Case status breakdown
  const statusCounts: Record<string, number> = {};
  cases.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });
  const totalCases = cases.length;

  // Needs-attention items — real signals, each links to the records behind it.
  const weekAhead = Date.now() + 7 * 86_400_000;
  const dueThisWeek = deadlines.filter(
    (d) => d.status === "PENDING" && new Date(d.dueDate).getTime() <= weekAhead
  ).length;
  const overdueInvoiceCount = billingRecords.filter((b) => b.paymentStatus === "OVERDUE").length;

  const attentionItems = [
    { key: "overdue-deadlines", count: overdueDeadlines, label: overdueDeadlines === 1 ? "Overdue deadline" : "Overdue deadlines", href: "/deadlines", icon: AlertTriangle, tone: "danger" as const },
    { key: "due-week", count: dueThisWeek, label: "Due this week", href: "/deadlines", icon: CalendarClock, tone: "warning" as const },
    { key: "awaiting-sig", count: pendingSigCount, label: "Awaiting signature", href: "/documents", icon: FileSignature, tone: "warning" as const },
    { key: "overdue-invoices", count: overdueInvoiceCount, label: overdueInvoiceCount === 1 ? "Overdue invoice" : "Overdue invoices", href: "/billing", icon: DollarSign, tone: "danger" as const },
  ].filter((a) => a.count > 0);

  const toneStyle = (tone: "danger" | "warning") =>
    tone === "danger"
      ? { bg: "var(--danger-bg)", color: "var(--danger)" }
      : { bg: "var(--warning-bg)", color: "var(--warning)" };
  const caseBreakdown = Object.entries(statusCounts).map(
    ([status, count]) => ({
      label: formatStatusLabel(status),
      count,
      total: totalCases,
      color: STATUS_COLORS[status] || "var(--text-muted)",
    })
  );

  // Stat cards with real data
  const statCards = [
    {
      label: "Active Cases",
      value: loading ? "--" : String(activeCases),
      sub: loading ? "" : `${totalCases} total ${totalCases === 1 ? "matter" : "matters"}`,
      icon: Briefcase,
      accent: "navy" as const,
      href: "/cases",
    },
    {
      label: "Pending Deadlines",
      value: loading ? "--" : String(pendingDeadlines),
      sub: loading ? "" : overdueDeadlines > 0 ? `${overdueDeadlines} overdue` : "none overdue",
      icon: CalendarClock,
      accent: "gold" as const,
      href: "/deadlines",
    },
    {
      label: "Overdue Deadlines",
      value: loading ? "--" : String(overdueDeadlines),
      sub: loading ? "" : overdueDeadlines > 0 ? "needs attention" : "all clear",
      icon: AlertTriangle,
      accent: "red" as const,
      href: "/deadlines",
    },
    {
      label: "Outstanding Revenue",
      value: loading ? "--" : formatCurrency(outstandingRevenue),
      sub: loading ? "" : `${unpaidCount} unpaid ${unpaidCount === 1 ? "invoice" : "invoices"}`,
      icon: DollarSign,
      accent: "green" as const,
      href: "/billing",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              {greeting}, {firstName}
            </h1>
            <p
              className="mt-0.5 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {dateStr}
            </p>
          </div>
          <Link href="/cases/new" className="lf-btn lf-btn-gold">
            <Plus style={{ width: 16, height: 16 }} />
            New Case
          </Link>
        </div>
      </div>

      {/* Needs attention — urgent, action-oriented, real data */}
      {!loading && (
        attentionItems.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              Needs attention
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {attentionItems.map((a) => {
                const t = toneStyle(a.tone);
                const Icon = a.icon;
                return (
                  <Link key={a.key} href={a.href} className="lf-card lf-card-interactive flex items-center gap-3 py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ background: t.bg }}>
                      <Icon style={{ width: 22, height: 22, color: t.color }} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: t.color, lineHeight: 1 }}>{a.count}</div>
                      <div className="text-xs font-medium mt-1" style={{ color: "var(--text-secondary)" }}>{a.label}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="lf-card flex items-center gap-3" style={{ borderLeft: "4px solid var(--success)" }}>
            <CheckCircle2 style={{ width: 22, height: 22, color: "var(--success)", flexShrink: 0 }} />
            <span className="text-sm font-medium" style={{ color: "var(--navy)" }}>You&apos;re all caught up — nothing needs attention right now.</span>
          </div>
        )
      )}

      {/* Practice at a glance */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`lf-card lf-card-interactive lf-stat-${card.accent} animate-fade-in-up block`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    background:
                      card.accent === "navy"
                        ? "rgba(15,27,51,0.08)"
                        : card.accent === "gold"
                        ? "rgba(196,154,46,0.12)"
                        : card.accent === "red"
                        ? "var(--danger-bg)"
                        : "var(--success-bg)",
                  }}
                >
                  <Icon
                    style={{
                      width: 18,
                      height: 18,
                      color:
                        card.accent === "navy"
                          ? "var(--navy)"
                          : card.accent === "gold"
                          ? "var(--gold)"
                          : card.accent === "red"
                          ? "var(--danger)"
                          : "var(--success)",
                    }}
                  />
                </div>
                {loading && (
                  <Loader2
                    style={{
                      width: 16,
                      height: 16,
                      color: "var(--text-muted)",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {card.label}
              </p>
              <p
                className="mt-1 text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--navy)",
                }}
              >
                {card.value}
              </p>
              {card.sub && (
                <div className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {card.sub}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          className="text-lg font-bold mb-3"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="lf-card lf-card-interactive flex flex-col items-center gap-2 py-4 text-center"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <Icon style={{ width: 18, height: 18, color: "var(--brand)" }} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--navy)" }}
                >
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-column: Deadlines + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="lf-card">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              Upcoming Deadlines
            </h2>
            {upcomingDeadlines.length > 0 && (
              <Link
                href="/deadlines"
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--gold)" }}
              >
                View All
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                style={{
                  width: 24,
                  height: 24,
                  color: "var(--text-muted)",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <CalendarClock style={{ width: 28, height: 28, color: "var(--text-muted)", marginBottom: 10 }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No upcoming deadlines.</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Track filing and court dates so nothing slips through.</p>
              <Link href="/deadlines/new" className="lf-btn lf-btn-gold mt-4" style={{ padding: "0.5rem 1rem" }}>
                <Plus style={{ width: 15, height: 15 }} /> Set a deadline
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((d) => {
                const urg =
                  urgencyStyles[d.priority] || urgencyStyles.MEDIUM;
                return (
                  <Link
                    key={d.id}
                    href={d.case?.id ? `/cases/${d.case.id}` : "/deadlines"}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:brightness-95 cursor-pointer"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: urg.bg }}
                    >
                      {d.priority === "HIGH" || d.priority === "URGENT" ? (
                        <AlertCircle
                          style={{
                            width: 16,
                            height: 16,
                            color: urg.text,
                          }}
                        />
                      ) : d.priority === "MEDIUM" ? (
                        <Clock
                          style={{
                            width: 16,
                            height: 16,
                            color: urg.text,
                          }}
                        />
                      ) : (
                        <CalendarClock
                          style={{
                            width: 16,
                            height: 16,
                            color: urg.text,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--navy)" }}
                      >
                        {d.title}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {d.case?.title || "Unlinked"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: urg.text }}
                      >
                        {getRelativeDate(d.dueDate)}
                      </p>
                      <span
                        className="lf-badge mt-0.5"
                        style={{
                          background: urg.bg,
                          color: urg.text,
                          fontSize: "10px",
                        }}
                      >
                        {urg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {/* TODO: Replace with real audit log API */}
        <div className="lf-card">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              Recent Activity
            </h2>
          </div>
          <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No recent activity yet. Actions across your matters will show up here.
          </div>
        </div>
      </div>

      {/* Case Status Breakdown */}
      <div className="lf-card">
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Case Status Breakdown
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              style={{
                width: 24,
                height: 24,
                color: "var(--text-muted)",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : caseBreakdown.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No cases yet. Create your first case to see the breakdown.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {caseBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: "var(--navy)" }}
                  >
                    {item.count}
                  </span>
                </div>
                <div className="lf-progress">
                  <div
                    className="lf-progress-fill"
                    style={{
                      width:
                        item.total > 0
                          ? `${(item.count / item.total) * 100}%`
                          : "0%",
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
