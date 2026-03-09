"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Briefcase,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  CASE_STATUS_LABELS,
  CASE_TYPE_LABELS,
} from "@/lib/constants";

interface CaseRecord {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  caseType: string;
  client: { id: string; name: string };
  _count: { deadlines: number; billingRecords: number };
}

const statusFilters = ["All", "OPEN", "ACTIVE", "ON_HOLD", "PENDING", "CLOSED"] as const;

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "var(--info-bg)", text: "var(--info)" },
  ACTIVE: { bg: "var(--success-bg)", text: "var(--success)" },
  ON_HOLD: { bg: "rgba(15,27,51,0.06)", text: "var(--navy)" },
  PENDING: { bg: "var(--warning-bg)", text: "var(--warning)" },
  CLOSED: { bg: "#F3F4F6", text: "var(--text-secondary)" },
  ARCHIVED: { bg: "#F3F4F6", text: "var(--text-muted)" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/cases?limit=50");
        if (!res.ok) throw new Error("Failed to fetch cases");
        const json = await res.json();
        if (json.success) {
          setCases(json.data);
        } else {
          throw new Error(json.error || "Failed to fetch cases");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.client.name.toLowerCase().includes(search.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = activeStatus === "All" || c.status === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [cases, search, activeStatus]);

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
              Cases
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Manage and track your legal cases
            </p>
          </div>
          <Link href="/cases/new" className="lf-btn lf-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            New Case
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="lf-search" style={{ maxWidth: 400 }}>
          <Search style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by title, client, or case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`lf-pill ${activeStatus === s ? "lf-pill-active" : ""}`}
            >
              {s === "All" ? "All" : CASE_STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="flex items-center gap-4 text-sm px-1"
        style={{ color: "var(--text-secondary)" }}
      >
        <span>
          <strong style={{ color: "var(--navy)" }}>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "case" : "cases"}
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="lf-card">
          <div className="lf-empty">
            <Loader2
              className="lf-empty-icon animate-spin"
              style={{ width: 36, height: 36, color: "var(--navy)" }}
            />
            <p className="lf-empty-title">Loading cases...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lf-card">
          <div className="lf-empty">
            <Briefcase className="lf-empty-icon" />
            <p className="lf-empty-title">No cases found</p>
            <p className="lf-empty-desc">
              {search || activeStatus !== "All"
                ? "Try adjusting your search or filters."
                : "Get started by creating your first case to begin tracking matters, deadlines, and billing."}
            </p>
            {!search && activeStatus === "All" && (
              <Link href="/cases/new" className="lf-btn lf-btn-gold">
                <Plus style={{ width: 16, height: 16 }} />
                Create First Case
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="lf-table">
            <thead>
              <tr>
                <th>
                  <button className="flex items-center gap-1">
                    Case
                    <ArrowUpDown style={{ width: 12, height: 12 }} />
                  </button>
                </th>
                <th>Client</th>
                <th>Type</th>
                <th>Status</th>
                <th>Deadlines</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = statusBadgeStyles[c.status] || statusBadgeStyles.ACTIVE;
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--navy)" }}>
                          {c.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {c.caseNumber}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: "var(--navy)" }}
                        >
                          {getInitials(c.client.name)}
                        </div>
                        <span className="text-sm">{c.client.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {CASE_TYPE_LABELS[c.caseType] || c.caseType}
                      </span>
                    </td>
                    <td>
                      <span
                        className="lf-badge"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {CASE_STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {c._count.deadlines}
                      </span>
                    </td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === c.id ? null : c.id);
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
                        {openMenuId === c.id && (
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
                                router.push(`/cases/${c.id}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Eye style={{ width: 14, height: 14 }} /> View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/cases/${c.id}/edit`);
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
    </div>
  );
}
