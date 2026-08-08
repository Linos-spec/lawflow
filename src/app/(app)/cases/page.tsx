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
  Sparkles,
  AlertTriangle,
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

// Urgency-coded: neutral blue for ordinary/new, green for healthy/active,
// amber for states needing attention (on hold / waiting), gray for done.
const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#dbeafe", text: "#1e40af" },      // Intake — neutral blue
  ACTIVE: { bg: "#dcfce7", text: "#15803d" },    // healthy green
  ON_HOLD: { bg: "#fef3c7", text: "#b45309" },   // attention amber
  PENDING: { bg: "#fef3c7", text: "#b45309" },   // waiting amber
  CLOSED: { bg: "#f1f5f9", text: "#475569" },    // done gray
  ARCHIVED: { bg: "#f1f5f9", text: "#64748b" },  // muted gray
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
  const [attention, setAttention] = useState<
    { id: string; title: string; caseNumber: string; client: string; score: number; reasons: { severity: string; text: string }[] }[]
  >([]);

  useEffect(() => {
    fetch("/api/v1/cases/attention")
      .then((r) => r.json())
      .then((j) => { if (j.success) setAttention(j.data.cases); })
      .catch(() => {});
  }, []);

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
          <Link href="/cases/new" className="lf-btn lf-btn-gold">
            <Plus style={{ width: 16, height: 16 }} />
            New Case
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
            <p className="lf-empty-title">Loading cases...</p>
          </div>
        </div>
      ) : cases.length === 0 ? (
        /* Zero-case onboarding leads the page — no search/filters until there's data. */
        <div className="lf-card" style={{ maxWidth: 460, margin: "1.5rem auto", padding: "2rem 1.75rem", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--gold-bg, #fef3e2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.9rem" }}>
            <Briefcase style={{ width: 25, height: 25, color: "var(--gold)" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, color: "var(--navy)" }}>Create your first case</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: 340, margin: "0.4rem auto 1.25rem" }}>Keep client details, documents, deadlines, tasks, and billing together.</p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/cases/new" className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 1.25rem" }}>
              <Plus style={{ width: 16, height: 16 }} /> Create case
            </Link>
            <button onClick={() => toast("Case import is coming soon.")} className="lf-btn lf-btn-outline" style={{ padding: "0.6rem 1.25rem" }}>
              Import cases
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Which cases need attention? — explainable, rules-based ranking */}
          {attention.length > 0 && (
            <div className="lf-card" style={{ borderLeft: "4px solid var(--gold)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
                <Sparkles style={{ width: 17, height: 17, color: "var(--gold)" }} />
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)" }}>Cases needing attention</h2>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>· ranked by concrete signals</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {attention.map((a) => (
                  <div key={a.id} onClick={() => router.push(`/cases/${a.id}`)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.6rem 0.75rem", borderRadius: 8, background: "var(--bg-base)", cursor: "pointer" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--navy)" }}>{a.title} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>· {a.client}</span></p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: 4 }}>
                        {a.reasons.map((r, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", fontWeight: 600, padding: "0.1rem 0.45rem", borderRadius: 999,
                            background: r.severity === "high" ? "var(--danger-bg)" : r.severity === "medium" ? "var(--warning-bg)" : "rgba(15,23,42,0.05)",
                            color: r.severity === "high" ? "var(--danger)" : r.severity === "medium" ? "var(--warning)" : "var(--text-secondary)" }}>
                            {r.severity === "high" && <AlertTriangle style={{ width: 11, height: 11 }} />}{r.text}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 600, flexShrink: 0 }}>Open →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search + Filters (only once cases exist) */}
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
          <div className="flex items-center gap-4 text-sm px-1" style={{ color: "var(--text-secondary)" }}>
            <span>
              <strong style={{ color: "var(--navy)" }}>{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "case" : "cases"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="lf-card">
              <div className="lf-empty">
                <Briefcase className="lf-empty-icon" />
                <p className="lf-empty-title">No matching cases</p>
                <p className="lf-empty-desc">Try adjusting your search or filters.</p>
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                if (!confirm(`Delete “${c.title}”? This removes the matter and its deadlines, documents, and tasks. This cannot be undone.`)) return;
                                const res = await fetch(`/api/v1/cases/${c.id}`, { method: "DELETE" });
                                if (res.ok) { setCases((prev) => prev.filter((x) => x.id !== c.id)); toast.success("Case deleted"); }
                                else { const j = await res.json().catch(() => ({})); toast.error(j.error || "Could not delete case"); }
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
