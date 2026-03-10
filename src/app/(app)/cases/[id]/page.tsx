"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Building,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CaseSummary } from "@/components/ai/case-summary";

interface CaseClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  clientType: string;
  company: string | null;
}

interface CaseDeadline {
  id: string;
  title: string;
  dueDate: string;
  deadlineType: string;
  status: string;
  priority: string;
}

interface BillingLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface BillingRecord {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  issueDate: string | null;
  dueDate: string;
  lineItems: BillingLineItem[];
}

interface CaseData {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  status: string;
  caseType: string;
  priority: string;
  notes: string | null;
  createdAt: string;
  client: CaseClient;
  deadlines: CaseDeadline[];
  billingRecords: BillingRecord[];
}

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "var(--info-bg)", text: "var(--info)" },
  ACTIVE: { bg: "var(--success-bg)", text: "var(--success)" },
  ON_HOLD: { bg: "var(--warning-bg)", text: "var(--warning)" },
  PENDING: { bg: "rgba(251,146,60,0.12)", text: "#ea580c" },
  CLOSED: { bg: "#F3F4F6", text: "var(--text-secondary)" },
  ARCHIVED: { bg: "rgba(100,116,139,0.1)", text: "#64748b" },
};

const priorityStyles: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "var(--danger-bg)", text: "var(--danger)" },
  URGENT: { bg: "var(--danger-bg)", text: "var(--danger)" },
  MEDIUM: { bg: "var(--warning-bg)", text: "var(--warning)" },
  LOW: { bg: "var(--success-bg)", text: "var(--success)" },
};

const paymentStyles: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "var(--success-bg)", text: "var(--success)" },
  UNPAID: { bg: "var(--danger-bg)", text: "var(--danger)" },
  PARTIAL: { bg: "var(--warning-bg)", text: "var(--warning)" },
  OVERDUE: { bg: "var(--danger-bg)", text: "var(--danger)" },
  OUTSTANDING: { bg: "var(--danger-bg)", text: "var(--danger)" },
  VOID: { bg: "#F3F4F6", text: "var(--text-secondary)" },
};

const deadlineStatusStyles: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "var(--warning-bg)", text: "var(--warning)" },
  COMPLETED: { bg: "var(--success-bg)", text: "var(--success)" },
  OVERDUE: { bg: "var(--danger-bg)", text: "var(--danger)" },
  CANCELLED: { bg: "#F3F4F6", text: "var(--text-secondary)" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await fetch(`/api/v1/cases/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch case");
        }
        const json = await res.json();
        if (json.success) {
          setCaseData(json.data);
        } else {
          setNotFound(true);
        }
      } catch {
        toast.error("Failed to load case details");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/cases" className="lf-btn lf-btn-ghost">
          <ArrowLeft style={{ width: 18, height: 18 }} />
          Back to Cases
        </Link>
        <div className="lf-card">
          <div className="lf-empty">
            <Loader2
              className="lf-empty-icon"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p className="lf-empty-title">Loading case...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !caseData) {
    return (
      <div className="space-y-6">
        <Link href="/cases" className="lf-btn lf-btn-ghost">
          <ArrowLeft style={{ width: 18, height: 18 }} />
          Back to Cases
        </Link>
        <div className="lf-card">
          <div className="lf-empty">
            <Briefcase className="lf-empty-icon" />
            <p className="lf-empty-title">Case not found</p>
            <p className="lf-empty-desc">
              The case you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const c = caseData;
  const sb = statusBadgeStyles[c.status] || statusBadgeStyles.ACTIVE;
  const pb = priorityStyles[c.priority] || priorityStyles.MEDIUM;
  const totalBilled = c.billingRecords.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/cases"
            className="lf-btn lf-btn-ghost"
            style={{ padding: "0.375rem" }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--navy)",
                }}
              >
                {c.title}
              </h1>
              <span
                className="lf-badge"
                style={{ background: sb.bg, color: sb.text }}
              >
                {formatStatusLabel(c.status)}
              </span>
              <span
                className="lf-badge"
                style={{ background: pb.bg, color: pb.text }}
              >
                {formatStatusLabel(c.priority)}
              </span>
            </div>
            <p
              className="mt-0.5 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {c.caseNumber} &middot; {c.caseType} &middot; Filed{" "}
              {formatDate(c.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content - left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Notes */}
          <div className="lf-card">
            <h2
              className="text-base font-bold mb-3"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              Description
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {c.description || "No description provided."}
            </p>
            {c.notes && (
              <>
                <h3
                  className="text-sm font-semibold mt-4 mb-1"
                  style={{ color: "var(--navy)" }}
                >
                  Notes
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {c.notes}
                </p>
              </>
            )}
          </div>

          {/* Deadlines */}
          <div className="lf-card">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--navy)",
                }}
              >
                Deadlines
              </h2>
              <Link
                href="/deadlines/new"
                className="text-xs font-semibold"
                style={{ color: "var(--gold)" }}
              >
                + Add Deadline
              </Link>
            </div>
            {c.deadlines.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No deadlines set for this case.
              </p>
            ) : (
              <div className="space-y-2">
                {c.deadlines.map((d) => {
                  const ps = priorityStyles[d.priority] || priorityStyles.MEDIUM;
                  const ds =
                    deadlineStatusStyles[d.status] ||
                    deadlineStatusStyles.PENDING;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-lg p-3"
                      style={{ background: "var(--bg-base)" }}
                    >
                      <div className="flex items-center gap-3">
                        {d.status === "COMPLETED" ? (
                          <Clock
                            style={{
                              width: 16,
                              height: 16,
                              color: "var(--success)",
                            }}
                          />
                        ) : (
                          <AlertCircle
                            style={{ width: 16, height: 16, color: ps.text }}
                          />
                        )}
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--navy)" }}
                          >
                            {d.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {formatDate(d.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="lf-badge"
                          style={{ background: ps.bg, color: ps.text }}
                        >
                          {formatStatusLabel(d.priority)}
                        </span>
                        <span
                          className="lf-badge"
                          style={{ background: ds.bg, color: ds.text }}
                        >
                          {formatStatusLabel(d.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Billing History */}
          <div
            className="lf-card"
            style={{
              padding: c.billingRecords.length > 0 ? 0 : undefined,
              overflow: "hidden",
            }}
          >
            {c.billingRecords.length > 0 ? (
              <>
                <div
                  className="px-6 py-4"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <h2
                    className="text-base font-bold"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--navy)",
                    }}
                  >
                    Billing History
                  </h2>
                </div>
                <table className="lf-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.billingRecords.map((b) => {
                      const bs =
                        paymentStyles[b.paymentStatus] || paymentStyles.UNPAID;
                      return (
                        <tr key={b.id}>
                          <td
                            className="text-sm font-medium"
                            style={{ color: "var(--navy)" }}
                          >
                            {b.invoiceNumber}
                          </td>
                          <td className="text-sm">
                            {b.issueDate ? formatDate(b.issueDate) : "--"}
                          </td>
                          <td className="text-sm">{formatDate(b.dueDate)}</td>
                          <td className="text-sm font-semibold">
                            {formatCurrency(b.totalAmount)}
                          </td>
                          <td className="text-sm">
                            {formatCurrency(b.paidAmount)}
                          </td>
                          <td>
                            <span
                              className="lf-badge"
                              style={{ background: bs.bg, color: bs.text }}
                            >
                              {formatStatusLabel(b.paymentStatus)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <h2
                  className="text-base font-bold mb-3"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--navy)",
                  }}
                >
                  Billing History
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No billing records yet.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - right 1/3 */}
        <div className="space-y-6">
          {/* Client info */}
          <div className="lf-card">
            <h2
              className="text-base font-bold mb-3"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              Client
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                style={{ background: "var(--navy)" }}
              >
                {getInitials(c.client.name)}
              </div>
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--navy)" }}
                >
                  {c.client.name}
                </p>
                {c.client.company && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {c.client.company}
                  </p>
                )}
              </div>
            </div>
            <div
              className="space-y-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <div className="flex items-center gap-2">
                <Mail
                  style={{
                    width: 14,
                    height: 14,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                />
                {c.client.email}
              </div>
              {c.client.phone && (
                <div className="flex items-center gap-2">
                  <Phone
                    style={{
                      width: 14,
                      height: 14,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  {c.client.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building
                  style={{
                    width: 14,
                    height: 14,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                />
                {formatStatusLabel(c.client.clientType)}
              </div>
            </div>
          </div>

          {/* Case value */}
          <div className="lf-card lf-stat-gold">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Total Billed
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--navy)",
              }}
            >
              {formatCurrency(totalBilled)}
            </p>
          </div>

          {/* Quick stats */}
          <div className="lf-card space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                <CalendarClock
                  style={{
                    width: 14,
                    height: 14,
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "text-bottom",
                  }}
                />
                Deadlines
              </span>
              <span
                className="font-semibold"
                style={{ color: "var(--navy)" }}
              >
                {c.deadlines.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                <FileText
                  style={{
                    width: 14,
                    height: 14,
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "text-bottom",
                  }}
                />
                Invoices
              </span>
              <span
                className="font-semibold"
                style={{ color: "var(--navy)" }}
              >
                {c.billingRecords.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                <DollarSign
                  style={{
                    width: 14,
                    height: 14,
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: "text-bottom",
                  }}
                />
                Total Billed
              </span>
              <span
                className="font-semibold"
                style={{ color: "var(--navy)" }}
              >
                {formatCurrency(totalBilled)}
              </span>
            </div>
          </div>

          {/* AI Draft Document link */}
          <Link
            href={`/cases/${id}/draft`}
            className="lf-card-interactive flex items-center gap-3 w-full"
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{
                background: "rgba(196,154,46,0.12)",
                color: "var(--gold)",
              }}
            >
              <Sparkles style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--navy)" }}
              >
                Draft Document with AI
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Generate letters, memos, and motions
              </p>
            </div>
          </Link>

          {/* AI Case Summary */}
          <CaseSummary caseId={id} />
        </div>
      </div>
    </div>
  );
}
