"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";

interface BillingRecord {
  id: string;
  invoiceNumber: string;
  billingType: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  dueDate: string;
  client: { id: string; name: string };
  case: { id: string; title: string; caseNumber: string };
  lineItems: unknown[];
}

const paymentStatusBadgeStyles: Record<string, { bg: string; text: string }> = {
  UNPAID: { bg: "var(--danger-bg)", text: "var(--danger)" },
  PARTIAL: { bg: "var(--warning-bg)", text: "var(--warning)" },
  PAID: { bg: "var(--success-bg)", text: "var(--success)" },
  OUTSTANDING: { bg: "var(--warning-bg)", text: "var(--warning)" },
  OVERDUE: { bg: "var(--danger-bg)", text: "var(--danger)" },
  VOID: { bg: "#F3F4F6", text: "var(--text-secondary)" },
};

export default function BillingPage() {
  const router = useRouter();
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/billing?limit=50");
        if (!res.ok) throw new Error("Failed to fetch billing records");
        const json = await res.json();
        if (json.success) {
          setRecords(json.data);
        } else {
          throw new Error(json.error || "Failed to fetch billing records");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load billing records");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.client.name.toLowerCase().includes(q) ||
        r.case.title.toLowerCase().includes(q) ||
        r.case.caseNumber.toLowerCase().includes(q)
    );
  }, [records, search]);

  const totalOutstanding = useMemo(
    () =>
      records
        .filter((r) => ["UNPAID", "PARTIAL", "OUTSTANDING"].includes(r.paymentStatus))
        .reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0),
    [records]
  );
  const totalPaid = useMemo(
    () => records.reduce((sum, r) => sum + r.paidAmount, 0),
    [records]
  );
  const totalOverdue = useMemo(
    () =>
      records
        .filter(
          (r) =>
            r.paymentStatus === "OVERDUE" ||
            (["UNPAID", "PARTIAL", "OUTSTANDING"].includes(r.paymentStatus) &&
              new Date(r.dueDate) < new Date())
        )
        .reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0),
    [records]
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
              Billing
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Manage invoices and billing records
            </p>
          </div>
          <Link href="/billing/new" className="lf-btn lf-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            New Invoice
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
            <p className="lf-empty-title">Loading billing records...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="lf-card lf-stat-gold">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Total Outstanding
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
              >
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="lf-card lf-stat-green">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Total Paid
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}
              >
                {formatCurrency(totalPaid)}
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
                {formatCurrency(totalOverdue)}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="lf-search" style={{ maxWidth: 400 }}>
            <Search
              style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }}
            />
            <input
              type="text"
              placeholder="Search by invoice #, client, or case..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filtered.length === 0 ? (
            <div className="lf-card">
              <div className="lf-empty">
                <DollarSign className="lf-empty-icon" />
                <p className="lf-empty-title">No invoices found</p>
                <p className="lf-empty-desc">
                  {search
                    ? "Try adjusting your search."
                    : "Create your first invoice to start billing."}
                </p>
                {!search && (
                  <Link href="/billing/new" className="lf-btn lf-btn-gold">
                    <Plus style={{ width: 16, height: 16 }} />
                    Create First Invoice
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="lf-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Case</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const ps =
                      paymentStatusBadgeStyles[r.paymentStatus] ||
                      paymentStatusBadgeStyles.UNPAID;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => router.push(`/billing/${r.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--navy)" }}
                          >
                            {r.invoiceNumber}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                            {r.client.name}
                          </span>
                        </td>
                        <td>
                          <div>
                            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                              {r.case.title}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {r.case.caseNumber}
                            </p>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--navy)" }}
                          >
                            {formatCurrency(r.totalAmount)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="lf-badge"
                            style={{ background: ps.bg, color: ps.text }}
                          >
                            {PAYMENT_STATUS_LABELS[r.paymentStatus] || r.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {formatDate(r.dueDate)}
                          </span>
                        </td>
                        <td>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === r.id ? null : r.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                              style={{ color: "var(--text-muted)" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--bg-base)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <MoreHorizontal style={{ width: 16, height: 16 }} />
                            </button>
                            {openMenuId === r.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-36 rounded-lg p-1 shadow-xl z-50 animate-fade-in"
                                style={{
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border-default)",
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/billing/${r.id}`);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  <Eye style={{ width: 14, height: 14 }} /> View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/billing/${r.id}/edit`);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  <Edit3 style={{ width: 14, height: 14 }} /> Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.error("Delete not yet implemented");
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                                  style={{ color: "var(--danger)" }}
                                >
                                  <Trash2 style={{ width: 14, height: 14 }} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
