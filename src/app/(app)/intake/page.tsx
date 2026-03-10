"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  INTAKE_STATUS_LABELS,
  CASE_TYPE_LABELS,
} from "@/lib/constants";
import { IntakeAnalysisButton } from "@/components/ai/intake-analysis";

interface IntakeRecord {
  id: string;
  prospectName: string;
  prospectEmail: string | null;
  prospectPhone: string | null;
  caseType: string;
  status: string;
  description: string | null;
  createdAt: string;
}

const statusFilters = ["All", "PENDING", "IN_REVIEW", "CONVERTED", "REJECTED"] as const;

const intakeStatusBadgeStyles: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "var(--warning-bg)", text: "var(--warning)" },
  IN_REVIEW: { bg: "var(--info-bg)", text: "var(--info)" },
  CONVERTED: { bg: "var(--success-bg)", text: "var(--success)" },
  REJECTED: { bg: "var(--danger-bg)", text: "var(--danger)" },
  COMPLETED: { bg: "var(--success-bg)", text: "var(--success)" },
};

export default function IntakePage() {
  const router = useRouter();
  const [forms, setForms] = useState<IntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntake() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/intake?limit=50");
        if (!res.ok) throw new Error("Failed to fetch intake forms");
        const json = await res.json();
        if (json.success) {
          setForms(json.data);
        } else {
          throw new Error(json.error || "Failed to fetch intake forms");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load intake forms");
      } finally {
        setLoading(false);
      }
    }
    fetchIntake();
  }, []);

  const filtered = useMemo(() => {
    return forms.filter((f) => {
      const matchSearch =
        !search ||
        f.prospectName.toLowerCase().includes(search.toLowerCase()) ||
        (f.prospectEmail && f.prospectEmail.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = activeStatus === "All" || f.status === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [forms, search, activeStatus]);

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
              Intake Forms
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Process new client intake submissions
            </p>
          </div>
          <Link href="/intake/new" className="lf-btn lf-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            New Intake
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="lf-search" style={{ maxWidth: 400 }}>
          <Search
            style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
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
              {s === "All" ? "All" : INTAKE_STATUS_LABELS[s] || s}
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
          {filtered.length === 1 ? "form" : "forms"}
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
            <p className="lf-empty-title">Loading intake forms...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lf-card">
          <div className="lf-empty">
            <FileText className="lf-empty-icon" />
            <p className="lf-empty-title">No intake forms found</p>
            <p className="lf-empty-desc">
              {search || activeStatus !== "All"
                ? "Try adjusting your search or filters."
                : "Start processing new client intakes."}
            </p>
            {!search && activeStatus === "All" && (
              <Link href="/intake/new" className="lf-btn lf-btn-gold">
                <Plus style={{ width: 16, height: 16 }} />
                Create First Intake
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="lf-table">
            <thead>
              <tr>
                <th>Prospect Name</th>
                <th>Email</th>
                <th>Matter Type</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: 40 }}>AI</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const ss =
                  intakeStatusBadgeStyles[f.status] || intakeStatusBadgeStyles.PENDING;
                return (
                  <tr
                    key={f.id}
                    onClick={() => router.push(`/intake/${f.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--navy)" }}
                      >
                        {f.prospectName}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {f.prospectEmail || "\u2014"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {CASE_TYPE_LABELS[f.caseType] || f.caseType}
                      </span>
                    </td>
                    <td>
                      <span
                        className="lf-badge"
                        style={{ background: ss.bg, color: ss.text }}
                      >
                        {INTAKE_STATUS_LABELS[f.status] || f.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(f.createdAt)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <IntakeAnalysisButton intakeId={f.id} />
                    </td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === f.id ? null : f.id);
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
                        {openMenuId === f.id && (
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
                                router.push(`/intake/${f.id}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Eye style={{ width: 14, height: 14 }} /> View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/intake/${f.id}/edit`);
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
