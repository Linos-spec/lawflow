"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  UserPlus,
  Clock,
  FileText,
  ArrowRight,
  Scale,
  Users,
  CheckCircle2,
  AlertCircle,
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

// TODO: Replace with real audit log API
const recentActivity = [
  { type: "case" as const, text: "New case opened: Martinez v. Acme Corp", time: "2 hours ago" },
  { type: "client" as const, text: "Client added: Sarah Thompson", time: "5 hours ago" },
  { type: "deadline" as const, text: "Deadline completed: File Preliminary Report", time: "Yesterday" },
  { type: "invoice" as const, text: "Invoice #1024 paid — $3,200", time: "2 days ago" },
];

const quickActions = [
  { label: "New Case", icon: Briefcase, href: "/cases/new", color: "var(--navy)" },
  { label: "Add Client", icon: UserPlus, href: "/clients/new", color: "var(--gold)" },
  { label: "Set Deadline", icon: Clock, href: "/deadlines/new", color: "var(--info)" },
  { label: "New Invoice", icon: FileText, href: "/billing/new", color: "var(--success)" },
];

const activityIcons: Record<string, React.ElementType> = {
  case: Scale,
  client: Users,
  deadline: CheckCircle2,
  invoice: DollarSign,
};

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
        const [casesRes, deadlinesRes, billingRes] = await Promise.all([
          fetch("/api/v1/cases?limit=50"),
          fetch("/api/v1/deadlines?limit=10"),
          fetch("/api/v1/billing?limit=10"),
        ]);

        const [casesJson, deadlinesJson, billingJson] = await Promise.all([
          casesRes.json(),
          deadlinesRes.json(),
          billingRes.json(),
        ]);

        if (casesJson.success) setCases(casesJson.data);
        if (deadlinesJson.success) setDeadlines(deadlinesJson.data);
        if (billingJson.success) setBillingRecords(billingJson.data);
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

  const outstandingRevenue = billingRecords
    .filter((b) =>
      ["UNPAID", "OUTSTANDING", "OVERDUE"].includes(b.paymentStatus)
    )
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

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
      trend: "+3",
      trendUp: true,
      icon: Briefcase,
      accent: "navy" as const,
      trendLabel: "this month",
    },
    {
      label: "Pending Deadlines",
      value: loading ? "--" : String(pendingDeadlines),
      trend: `${pendingDeadlines} upcoming`,
      trendUp: false,
      icon: CalendarClock,
      accent: "gold" as const,
      trendLabel: "",
    },
    {
      label: "Overdue",
      value: loading ? "--" : String(overdueDeadlines),
      trend: "-2",
      trendUp: true,
      icon: AlertTriangle,
      accent: "red" as const,
      trendLabel: "vs last month",
    },
    {
      label: "Outstanding Revenue",
      value: loading ? "--" : formatCurrency(outstandingRevenue),
      trend: "+12%",
      trendUp: true,
      icon: DollarSign,
      accent: "green" as const,
      trendLabel: "vs last month",
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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`lf-card lf-stat-${card.accent} animate-fade-in-up`}
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
              {/* Static trend placeholders - TODO: compute from historical data */}
              <div className="mt-2 flex items-center gap-1 text-xs font-medium">
                {card.trendUp ? (
                  <TrendingUp
                    style={{ width: 14, height: 14, color: "var(--success)" }}
                  />
                ) : (
                  <TrendingDown
                    style={{ width: 14, height: 14, color: "var(--warning)" }}
                  />
                )}
                <span
                  style={{
                    color: card.trendUp
                      ? "var(--success)"
                      : "var(--warning)",
                  }}
                >
                  {card.trend}
                </span>
                {card.trendLabel && (
                  <span style={{ color: "var(--text-muted)" }}>
                    {card.trendLabel}
                  </span>
                )}
              </div>
            </div>
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
                className="lf-card lf-card-interactive flex flex-col items-center gap-2.5 py-5 text-center"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${action.color}10` }}
                >
                  <Icon
                    style={{ width: 20, height: 20, color: action.color }}
                  />
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
            <Link
              href="/deadlines"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--gold)" }}
            >
              View All
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
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
            <p className="text-sm py-4" style={{ color: "var(--text-muted)" }}>
              No upcoming deadlines.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((d) => {
                const urg =
                  urgencyStyles[d.priority] || urgencyStyles.MEDIUM;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors"
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
                  </div>
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
          <div className="space-y-3">
            {recentActivity.map((a, i) => {
              const Icon = activityIcons[a.type];
              return (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0"
                    style={{ background: "rgba(15,27,51,0.06)" }}
                  >
                    <Icon
                      style={{
                        width: 15,
                        height: 15,
                        color: "var(--navy)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--navy)" }}>
                      {a.text}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {a.time}
                    </p>
                  </div>
                </div>
              );
            })}
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
