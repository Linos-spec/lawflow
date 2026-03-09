"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

interface CaseRow {
  id: string;
  caseNumber: string;
  title: string;
  client: string;
  clientInitials: string;
  type: string;
  status: string;
  nextDeadline: string;
  value: number;
}

const statusOptions = ["All", "Active", "Discovery", "Pending Trial", "Closed", "On Hold"] as const;

const statusColors: Record<string, { bg: string; text: string }> = {
  Active:        { bg: "var(--success-bg)", text: "var(--success)" },
  Discovery:     { bg: "var(--warning-bg)", text: "var(--warning)" },
  "Pending Trial": { bg: "var(--info-bg)", text: "var(--info)" },
  Closed:        { bg: "#F3F4F6", text: "var(--text-secondary)" },
  "On Hold":     { bg: "rgba(15,27,51,0.06)", text: "var(--navy)" },
};

const sampleCases: CaseRow[] = [
  {
    id: "1",
    caseNumber: "LF-2024-001",
    title: "Martinez v. Acme Corp",
    client: "Carlos Martinez",
    clientInitials: "CM",
    type: "Civil Litigation",
    status: "Active",
    nextDeadline: "Mar 15, 2026",
    value: 45000,
  },
  {
    id: "2",
    caseNumber: "LF-2024-002",
    title: "Johnson Estate Planning",
    client: "Margaret Johnson",
    clientInitials: "MJ",
    type: "Estate Planning",
    status: "Discovery",
    nextDeadline: "Mar 18, 2026",
    value: 12000,
  },
  {
    id: "3",
    caseNumber: "LF-2024-003",
    title: "Thompson Divorce",
    client: "Sarah Thompson",
    clientInitials: "ST",
    type: "Family Law",
    status: "Active",
    nextDeadline: "Mar 22, 2026",
    value: 8500,
  },
  {
    id: "4",
    caseNumber: "LF-2024-004",
    title: "Roberts LLC Formation",
    client: "David Roberts",
    clientInitials: "DR",
    type: "Business Law",
    status: "Pending Trial",
    nextDeadline: "Apr 5, 2026",
    value: 5200,
  },
  {
    id: "5",
    caseNumber: "LF-2024-005",
    title: "Williams Personal Injury",
    client: "James Williams",
    clientInitials: "JW",
    type: "Personal Injury",
    status: "Closed",
    nextDeadline: "—",
    value: 92000,
  },
];

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sampleCases.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.client.toLowerCase().includes(search.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = activeStatus === "All" || c.status === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [search, activeStatus]);

  const totalValue = filtered.reduce((sum, c) => sum + c.value, 0);

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
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`lf-pill ${activeStatus === s ? "lf-pill-active" : ""}`}
            >
              {s}
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
        <span style={{ color: "var(--border-default)" }}>|</span>
        <span>
          Total value:{" "}
          <strong style={{ color: "var(--navy)" }}>
            ${totalValue.toLocaleString()}
          </strong>
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
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
                <th>Next Deadline</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = statusColors[c.status] || statusColors.Active;
                return (
                  <tr key={c.id}>
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
                          {c.clientInitials}
                        </div>
                        <span className="text-sm">{c.client}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {c.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className="lf-badge"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {c.nextDeadline}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                        ${c.value.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
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
                            <button className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--text-primary)" }}>
                              <Eye style={{ width: 14, height: 14 }} /> View
                            </button>
                            <button className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--text-primary)" }}>
                              <Edit3 style={{ width: 14, height: 14 }} /> Edit
                            </button>
                            <button className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--danger)" }}>
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
