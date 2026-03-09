"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  User,
  CalendarClock,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";

// Sample data keyed by ID - matches the cases list
const casesData: Record<string, {
  caseNumber: string;
  title: string;
  client: string;
  clientInitials: string;
  clientEmail: string;
  clientPhone: string;
  type: string;
  status: string;
  value: number;
  description: string;
  filingDate: string;
  deadlines: { title: string; date: string; status: string; priority: string }[];
  billingHistory: { invoice: string; date: string; amount: number; status: string }[];
  notes: string;
}> = {
  "1": {
    caseNumber: "LF-2024-001",
    title: "Martinez v. Acme Corp",
    client: "Carlos Martinez",
    clientInitials: "CM",
    clientEmail: "carlos@email.com",
    clientPhone: "(555) 123-4567",
    type: "Civil Litigation",
    status: "Active",
    value: 45000,
    description: "Product liability case involving defective manufacturing equipment. Client sustained injuries at workplace due to malfunctioning machinery.",
    filingDate: "Jan 15, 2026",
    deadlines: [
      { title: "File Motion to Dismiss", date: "Mar 15, 2026", status: "Pending", priority: "High" },
      { title: "Discovery Response Due", date: "Apr 1, 2026", status: "Pending", priority: "Medium" },
      { title: "Initial Filing Completed", date: "Jan 15, 2026", status: "Completed", priority: "High" },
    ],
    billingHistory: [
      { invoice: "INV-1001", date: "Feb 1, 2026", amount: 5000, status: "Paid" },
      { invoice: "INV-1015", date: "Mar 1, 2026", amount: 3500, status: "Unpaid" },
    ],
    notes: "Client prefers communication via email. Key evidence includes maintenance logs and safety inspection reports.",
  },
  "2": {
    caseNumber: "LF-2024-002",
    title: "Johnson Estate Planning",
    client: "Margaret Johnson",
    clientInitials: "MJ",
    clientEmail: "margaret.j@email.com",
    clientPhone: "(555) 234-5678",
    type: "Estate Planning",
    status: "Discovery",
    value: 12000,
    description: "Comprehensive estate planning including will creation, trust establishment, and power of attorney documents.",
    filingDate: "Feb 5, 2026",
    deadlines: [
      { title: "Discovery Response Due", date: "Mar 18, 2026", status: "Pending", priority: "High" },
    ],
    billingHistory: [
      { invoice: "INV-1008", date: "Feb 15, 2026", amount: 2500, status: "Paid" },
    ],
    notes: "Multiple beneficiaries involved. Schedule family meeting for document review.",
  },
  "3": {
    caseNumber: "LF-2024-003",
    title: "Thompson Divorce",
    client: "Sarah Thompson",
    clientInitials: "ST",
    clientEmail: "sarah.t@email.com",
    clientPhone: "(555) 345-6789",
    type: "Family Law",
    status: "Active",
    value: 8500,
    description: "Uncontested divorce proceedings with mutual agreement on asset division. Two minor children involved with custody arrangement.",
    filingDate: "Feb 20, 2026",
    deadlines: [
      { title: "Client Meeting Prep", date: "Mar 22, 2026", status: "Pending", priority: "Medium" },
    ],
    billingHistory: [
      { invoice: "INV-1012", date: "Mar 1, 2026", amount: 2000, status: "Paid" },
    ],
    notes: "Client is cooperative. Opposing counsel: J. Davis at Davis & Associates.",
  },
  "4": {
    caseNumber: "LF-2024-004",
    title: "Roberts LLC Formation",
    client: "David Roberts",
    clientInitials: "DR",
    clientEmail: "david@robertsco.com",
    clientPhone: "(555) 456-7890",
    type: "Business Law",
    status: "Pending Trial",
    value: 5200,
    description: "LLC formation and operating agreement drafting for a new technology consulting firm.",
    filingDate: "Mar 1, 2026",
    deadlines: [
      { title: "Annual Filing Deadline", date: "Apr 5, 2026", status: "Pending", priority: "Low" },
    ],
    billingHistory: [],
    notes: "Needs EIN application and state filing. Multi-member LLC with 3 partners.",
  },
  "5": {
    caseNumber: "LF-2024-005",
    title: "Williams Personal Injury",
    client: "James Williams",
    clientInitials: "JW",
    clientEmail: "james.w@email.com",
    clientPhone: "(555) 567-8901",
    type: "Personal Injury",
    status: "Closed",
    value: 92000,
    description: "Auto accident personal injury claim. Settlement reached with insurance provider.",
    filingDate: "Oct 10, 2025",
    deadlines: [],
    billingHistory: [
      { invoice: "INV-0982", date: "Nov 1, 2025", amount: 15000, status: "Paid" },
      { invoice: "INV-0998", date: "Jan 15, 2026", amount: 8000, status: "Paid" },
    ],
    notes: "Case settled for $92,000. Client satisfied with outcome.",
  },
};

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  Active: { bg: "var(--success-bg)", text: "var(--success)" },
  Discovery: { bg: "var(--warning-bg)", text: "var(--warning)" },
  "Pending Trial": { bg: "var(--info-bg)", text: "var(--info)" },
  Closed: { bg: "#F3F4F6", text: "var(--text-secondary)" },
  "On Hold": { bg: "rgba(15,27,51,0.06)", text: "var(--navy)" },
};

const priorityStyles: Record<string, { bg: string; text: string }> = {
  High: { bg: "var(--danger-bg)", text: "var(--danger)" },
  Medium: { bg: "var(--warning-bg)", text: "var(--warning)" },
  Low: { bg: "var(--success-bg)", text: "var(--success)" },
};

const paymentStyles: Record<string, { bg: string; text: string }> = {
  Paid: { bg: "var(--success-bg)", text: "var(--success)" },
  Unpaid: { bg: "var(--danger-bg)", text: "var(--danger)" },
};

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const c = casesData[id];

  if (!c) {
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
            <p className="lf-empty-desc">The case you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const sb = statusBadgeStyles[c.status] || statusBadgeStyles.Active;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href="/cases" className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
              >
                {c.title}
              </h1>
              <span className="lf-badge" style={{ background: sb.bg, color: sb.text }}>
                {c.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {c.caseNumber} &middot; {c.type} &middot; Filed {c.filingDate}
            </p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="lf-card">
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
            >
              Description
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {c.description}
            </p>
            {c.notes && (
              <>
                <h3 className="text-sm font-semibold mt-4 mb-1" style={{ color: "var(--navy)" }}>
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
                style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
              >
                Deadlines
              </h2>
              <Link href="/deadlines/new" className="text-xs font-semibold" style={{ color: "var(--gold)" }}>
                + Add Deadline
              </Link>
            </div>
            {c.deadlines.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No deadlines set for this case.</p>
            ) : (
              <div className="space-y-2">
                {c.deadlines.map((d, i) => {
                  const ps = priorityStyles[d.priority] || priorityStyles.Medium;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg p-3"
                      style={{ background: "var(--bg-base)" }}
                    >
                      <div className="flex items-center gap-3">
                        {d.status === "Completed" ? (
                          <Clock style={{ width: 16, height: 16, color: "var(--success)" }} />
                        ) : (
                          <AlertCircle style={{ width: 16, height: 16, color: ps.text }} />
                        )}
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                            {d.title}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{d.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="lf-badge" style={{ background: ps.bg, color: ps.text }}>
                          {d.priority}
                        </span>
                        <span
                          className="lf-badge"
                          style={{
                            background: d.status === "Completed" ? "var(--success-bg)" : "var(--warning-bg)",
                            color: d.status === "Completed" ? "var(--success)" : "var(--warning)",
                          }}
                        >
                          {d.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Billing History */}
          <div className="lf-card" style={{ padding: c.billingHistory.length > 0 ? 0 : undefined, overflow: "hidden" }}>
            {c.billingHistory.length > 0 ? (
              <>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <h2
                    className="text-base font-bold"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                  >
                    Billing History
                  </h2>
                </div>
                <table className="lf-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.billingHistory.map((b, i) => {
                      const bs = paymentStyles[b.status] || paymentStyles.Unpaid;
                      return (
                        <tr key={i}>
                          <td className="text-sm font-medium" style={{ color: "var(--navy)" }}>{b.invoice}</td>
                          <td className="text-sm">{b.date}</td>
                          <td className="text-sm font-semibold">${b.amount.toLocaleString()}</td>
                          <td>
                            <span className="lf-badge" style={{ background: bs.bg, color: bs.text }}>
                              {b.status}
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
                  style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                >
                  Billing History
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No billing records yet.</p>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <div className="lf-card">
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
            >
              Client
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                style={{ background: "var(--navy)" }}
              >
                {c.clientInitials}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{c.client}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-2">
                <User style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
                {c.clientEmail}
              </div>
              <div className="flex items-center gap-2">
                <User style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
                {c.clientPhone}
              </div>
            </div>
          </div>

          {/* Case value */}
          <div className="lf-card lf-stat-gold">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Case Value
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
            >
              ${c.value.toLocaleString()}
            </p>
          </div>

          {/* Quick stats */}
          <div className="lf-card space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Deadlines</span>
              <span className="font-semibold" style={{ color: "var(--navy)" }}>{c.deadlines.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Invoices</span>
              <span className="font-semibold" style={{ color: "var(--navy)" }}>{c.billingHistory.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Total Billed</span>
              <span className="font-semibold" style={{ color: "var(--navy)" }}>
                ${c.billingHistory.reduce((s, b) => s + b.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
