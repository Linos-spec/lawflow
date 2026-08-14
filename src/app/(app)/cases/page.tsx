"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  Upload,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { CASE_STATUS_LABELS, CASE_TYPE_LABELS } from "@/lib/constants";

interface NextDeadline { dueDate: string; title: string; status: string }
interface CaseRecord {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  caseType: string;
  updatedAt: string;
  client: { id: string; name: string };
  responsibleAttorney: { id: string; name: string } | null;
  deadlines: NextDeadline[];
  _count: { deadlines: number; billingRecords: number };
}

const statusFilters = ["All", "OPEN", "ACTIVE", "ON_HOLD", "PENDING", "CLOSED"] as const;

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#dbeafe", text: "#1e40af" },
  ACTIVE: { bg: "#dcfce7", text: "#15803d" },
  ON_HOLD: { bg: "#fef3c7", text: "#b45309" },
  PENDING: { bg: "#fef3c7", text: "#b45309" },
  CLOSED: { bg: "#f1f5f9", text: "#475569" },
  ARCHIVED: { bg: "#f1f5f9", text: "#64748b" },
};

type SortKey = "updatedAt" | "title";
function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [attention, setAttention] = useState<
    { id: string; title: string; caseNumber: string; client: string; score: number; reasons: { severity: string; text: string }[] }[]
  >([]);
  const searchTracked = useRef(false);

  async function fetchCases() {
    try {
      setLoading(true);
      setLoadError(false);
      const res = await fetch("/api/v1/cases?limit=50");
      if (!res.ok) throw new Error("Failed to fetch cases");
      const json = await res.json();
      if (json.success) setCases(json.data);
      else throw new Error(json.error || "Failed to fetch cases");
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCases(); }, []);
  useEffect(() => {
    fetch("/api/v1/cases/attention")
      .then((r) => r.json())
      .then((j) => { if (j.success) setAttention(j.data.cases); })
      .catch(() => {});
  }, []);

  // Analytics: first-use empty state seen.
  useEffect(() => {
    if (!loading && !loadError && cases.length === 0) track("cases_empty_state_viewed");
  }, [loading, loadError, cases.length]);

  const filtered = useMemo(() => {
    const rows = cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.client.name.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q);
      const matchStatus = activeStatus === "All" || c.status === activeStatus;
      return matchSearch && matchStatus;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
      return (+new Date(a.updatedAt) - +new Date(b.updatedAt)) * dir;
    });
  }, [cases, search, activeStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "title" ? "asc" : "desc"); }
  };

  const onSearch = (v: string) => {
    setSearch(v);
    if (v && !searchTracked.current) { track("cases_search_used"); searchTracked.current = true; }
    if (!v) searchTracked.current = false;
  };
  const onFilter = (s: string) => { setActiveStatus(s); track("cases_filter_applied", { status: s }); };

  const hasCases = cases.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header — persistent "New case" only once cases exist (no competing CTA in the empty state) */}
      <header className="mb-6 pb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>Cases</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>Manage and track your legal matters</p>
          </div>
          {hasCases && (
            <div className="flex items-center gap-2">
              <Link href="/cases/import" className="lf-btn lf-btn-outline" aria-label="Import cases">
                <Upload style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Import</span>
              </Link>
              <Link href="/cases/new" onClick={() => track("case_create_started", { from: "header" })} className="lf-btn lf-btn-gold">
                <Plus style={{ width: 16, height: 16 }} /> New case
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Initial loading */}
      {loading ? (
        <div className="lf-card">
          <div className="lf-empty">
            <Loader2 className="lf-empty-icon animate-spin" style={{ width: 36, height: 36, color: "var(--navy)" }} />
            <p className="lf-empty-title">Loading cases…</p>
          </div>
        </div>
      ) : loadError ? (
        /* Loading failure */
        <div className="lf-empty-center">
          <div className="lf-empty-card" role="alert">
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.9rem" }}>
              <AlertTriangle style={{ width: 25, height: 25, color: "var(--danger)" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, color: "var(--navy)" }}>Couldn&apos;t load your cases</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0.4rem auto 0" }}>Something went wrong reaching the server.</p>
            <div className="lf-empty-actions">
              <button onClick={fetchCases} className="lf-btn lf-btn-gold"><RefreshCw style={{ width: 16, height: 16 }} /> Try again</button>
            </div>
          </div>
        </div>
      ) : !hasCases ? (
        /* First-use empty state — single primary CTA, centered */
        <div className="lf-empty-center">
          <div className="lf-empty-card">
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--gold-bg, #fef3e2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Briefcase style={{ width: 26, height: 26, color: "var(--gold)" }} aria-hidden />
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)" }}>Create your first case</h2>
            <p style={{ fontSize: "0.925rem", color: "var(--text-secondary)", maxWidth: 400, margin: "0.5rem auto 0", lineHeight: 1.5 }}>
              Keep client information, documents, deadlines, tasks, and billing organized in one place.
            </p>
            <div className="lf-empty-actions">
              <Link href="/cases/new" onClick={() => track("case_create_started", { from: "empty_state" })} className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 1.25rem" }}>
                <Plus style={{ width: 16, height: 16 }} /> Create your first case
              </Link>
              <Link href="/cases/import" className="lf-btn lf-btn-outline" style={{ padding: "0.6rem 1.25rem" }}>
                <Upload style={{ width: 16, height: 16 }} /> Import cases
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Cases needing attention */}
          {attention.length > 0 && (
            <div className="lf-card" style={{ borderLeft: "4px solid var(--gold)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
                <Sparkles style={{ width: 17, height: 17, color: "var(--gold)" }} aria-hidden />
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

          {/* Search + filters */}
          <div className="space-y-3">
            <div className="lf-search" style={{ maxWidth: 400 }}>
              <Search style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} aria-hidden />
              <input
                type="text"
                aria-label="Search cases"
                placeholder="Search by title, client, or case number…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => onFilter(s)}
                  aria-pressed={activeStatus === s}
                  className={`lf-pill ${activeStatus === s ? "lf-pill-active" : ""}`}
                >
                  {s === "All" ? "All" : CASE_STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="flex items-center gap-4 text-sm px-1" style={{ color: "var(--text-secondary)" }}>
            <span><strong style={{ color: "var(--navy)" }}>{filtered.length}</strong> {filtered.length === 1 ? "case" : "cases"}</span>
          </div>

          {filtered.length === 0 ? (
            /* Filtered-empty (distinct from first-use) */
            <div className="lf-card">
              <div className="lf-empty">
                <Search className="lf-empty-icon" aria-hidden />
                <p className="lf-empty-title">No cases match your filters</p>
                <p className="lf-empty-desc">Try a different search term or status.</p>
                <button onClick={() => { setSearch(""); setActiveStatus("All"); searchTracked.current = false; }} className="lf-btn lf-btn-outline" style={{ marginTop: "0.75rem" }}>
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="lf-card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="lf-table">
                <thead>
                  <tr>
                    <th>
                      <button className="flex items-center gap-1" onClick={() => toggleSort("title")} aria-label="Sort by matter">
                        Matter <ArrowUpDown style={{ width: 12, height: 12 }} />
                      </button>
                    </th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Responsible attorney</th>
                    <th>Next deadline</th>
                    <th>
                      <button className="flex items-center gap-1" onClick={() => toggleSort("updatedAt")} aria-label="Sort by last updated">
                        Last updated <ArrowUpDown style={{ width: 12, height: 12 }} />
                      </button>
                    </th>
                    <th style={{ width: 48 }}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const sc = statusBadgeStyles[c.status] || statusBadgeStyles.ACTIVE;
                    const next = c.deadlines?.[0];
                    return (
                      <tr key={c.id} onClick={() => router.push(`/cases/${c.id}`)} style={{ cursor: "pointer" }}>
                        <td>
                          <p className="font-semibold" style={{ color: "var(--navy)" }}>{c.title}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.caseNumber}</p>
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: "var(--navy)" }}>{getInitials(c.client.name)}</div>
                            <span className="text-sm">{c.client.name}</span>
                          </div>
                        </td>
                        <td><span className="lf-badge" style={{ background: sc.bg, color: sc.text }}>{CASE_STATUS_LABELS[c.status] || c.status}</span></td>
                        <td>
                          <span className="text-sm" style={{ color: c.responsibleAttorney ? "var(--text-secondary)" : "var(--text-muted)" }}>
                            {c.responsibleAttorney?.name || "Unassigned"}
                          </span>
                        </td>
                        <td>
                          {next ? (
                            <span className="text-sm" style={{ color: next.status === "OVERDUE" ? "var(--danger)" : "var(--text-secondary)", fontWeight: next.status === "OVERDUE" ? 600 : 400 }}>
                              {formatDate(next.dueDate)}
                            </span>
                          ) : (
                            <span className="text-sm" style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td><span className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(c.updatedAt)}</span></td>
                        <td>
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id); }}
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                              style={{ color: "var(--text-muted)" }}
                              aria-label={`Actions for ${c.title}`}
                              aria-haspopup="menu"
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-base)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <MoreHorizontal style={{ width: 16, height: 16 }} />
                            </button>
                            {openMenuId === c.id && (
                              <div role="menu" className="absolute right-0 top-full mt-1 w-36 rounded-lg p-1 shadow-xl z-50 animate-fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                <button role="menuitem" onClick={(e) => { e.stopPropagation(); router.push(`/cases/${c.id}`); }} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors" style={{ color: "var(--text-primary)" }}>
                                  <Eye style={{ width: 14, height: 14 }} /> View
                                </button>
                                <button role="menuitem" onClick={(e) => { e.stopPropagation(); router.push(`/cases/${c.id}`); }} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors" style={{ color: "var(--text-primary)" }}>
                                  <Edit3 style={{ width: 14, height: 14 }} /> Edit
                                </button>
                                <button role="menuitem" onClick={async (e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    if (!confirm(`Delete “${c.title}”? This removes the matter and its deadlines, documents, and tasks. This cannot be undone.`)) return;
                                    const res = await fetch(`/api/v1/cases/${c.id}`, { method: "DELETE" });
                                    if (res.ok) { setCases((prev) => prev.filter((x) => x.id !== c.id)); toast.success("Case deleted"); }
                                    else { const j = await res.json().catch(() => ({})); toast.error(j.error || "Could not delete case"); }
                                  }} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors" style={{ color: "var(--danger)" }}>
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
