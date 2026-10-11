"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Building2, Users, DollarSign, TrendingUp, AlertTriangle, Search, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface FirmRow {
  id: string; name: string; email: string | null; createdAt: string;
  status: string; locked: boolean; trialEndsAt: string | null; trialDaysLeft: number | null;
  users: number; matters: number; clients: number; leads: number; seats: number; mrr: number;
  calendlyConnected: boolean; lastActivity: string | null;
}
interface Summary {
  totalFirms: number; byStatus: Record<string, number>; activePaying: number; trialing: number;
  pastDue: number; mrr: number; totalUsers: number; totalMatters: number; newLast30d: number;
  trialsEndingSoon: number; seatPrice: number;
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
const fmtAgo = (iso: string | null) => {
  if (!iso) return "never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
};

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: "Active", bg: "#dcf5e8", fg: "#1a7a4c" },
  trialing: { label: "Trial", bg: "#e7f0fb", fg: "#2b6cb0" },
  past_due: { label: "Past due", bg: "#fdecc8", fg: "#92610e" },
  trial_expired: { label: "Trial expired", bg: "#fde2e1", fg: "#b42318" },
  canceled: { label: "Canceled", bg: "#eee", fg: "#666" },
  none: { label: "No plan", bg: "#eee", fg: "#666" },
};

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [firms, setFirms] = useState<FirmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/firms");
      if (res.status === 403) { setForbidden(true); return; }
      const j = await res.json();
      if (j.success) { setSummary(j.data.summary); setFirms(j.data.firms); }
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const extendTrial = async (f: FirmRow) => {
    const input = window.prompt(`Extend ${f.name}'s trial by how many days?`, "14");
    if (input == null) return;
    const days = parseInt(input, 10);
    if (!Number.isFinite(days) || days < 1) { toast.error("Enter a number of days"); return; }
    setBusyId(f.id);
    try {
      const res = await fetch(`/api/admin/firms/${f.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", days }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) { toast.error(j.error || "Couldn't extend trial"); return; }
      toast.success(`${f.name}: trial now ends ${fmtDate(j.data.trialEndsAt)}`);
      await load();
    } finally { setBusyId(null); }
  };

  const filtered = useMemo(() => firms.filter((f) => {
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (q && !`${f.name} ${f.email ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [firms, q, statusFilter]);

  if (forbidden) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "2rem" }}>
        <div className="lf-card" style={{ maxWidth: 440, textAlign: "center", padding: "2.5rem" }}>
          <ShieldAlert style={{ width: 40, height: 40, color: "var(--danger)", margin: "0 auto 0.75rem" }} />
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--navy)", fontSize: "1.2rem" }}>Platform access only</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            This console is for the Linoscore Legal operator. Your account isn&apos;t on the platform-admin allowlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>Platform Console</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Every firm on Linoscore Legal — monitor and manage your customers.</p>
        </div>

        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center" }}><Loader2 style={{ width: 26, height: 26, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <Stat icon={<Building2 />} label="Total firms" value={String(summary.totalFirms)} sub={`${summary.newLast30d} new in 30d`} />
                <Stat icon={<DollarSign />} label="MRR" value={money(summary.mrr)} sub={`${summary.activePaying} paying`} accent />
                <Stat icon={<TrendingUp />} label="On trial" value={String(summary.trialing)} sub={`${summary.trialsEndingSoon} ending ≤7d`} />
                <Stat icon={<AlertTriangle />} label="Past due" value={String(summary.pastDue)} sub="need attention" />
                <Stat icon={<Users />} label="Total seats" value={String(summary.totalUsers)} sub={`${summary.totalMatters} matters`} />
              </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <Search style={{ width: 15, height: 15, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input className="lf-input" style={{ paddingLeft: 32 }} placeholder="Search firm name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="lf-input" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Trial</option>
                <option value="past_due">Past due</option>
                <option value="trial_expired">Trial expired</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            {/* Firm table */}
            <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-base)", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      <Th>Firm</Th><Th>Status</Th><Th>Seats</Th><Th>Matters</Th><Th>Clients</Th><Th>MRR</Th><Th>Trial</Th><Th>Last active</Th><Th>Joined</Th><Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => {
                      const s = STATUS[f.status] || STATUS.none;
                      return (
                        <tr key={f.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                          <Td>
                            <div style={{ fontWeight: 600, color: "var(--navy)" }}>{f.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{f.email || "—"}{f.calendlyConnected ? " · 📅" : ""}</div>
                          </Td>
                          <Td><span className="lf-badge" style={{ background: s.bg, color: s.fg }}>{s.label}</span></Td>
                          <Td>{f.seats}</Td>
                          <Td>{f.matters}</Td>
                          <Td>{f.clients}</Td>
                          <Td style={{ fontWeight: 600, color: f.mrr > 0 ? "var(--navy)" : "var(--text-muted)" }}>{f.mrr > 0 ? money(f.mrr) : "—"}</Td>
                          <Td>{f.status === "trialing" && f.trialDaysLeft != null ? <span style={{ color: f.trialDaysLeft <= 3 ? "var(--danger)" : "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 3 }}><Clock style={{ width: 12, height: 12 }} />{f.trialDaysLeft}d</span> : "—"}</Td>
                          <Td style={{ color: "var(--text-muted)" }}>{fmtAgo(f.lastActivity)}</Td>
                          <Td style={{ color: "var(--text-muted)" }}>{fmtDate(f.createdAt)}</Td>
                          <Td>
                            <button onClick={() => extendTrial(f)} disabled={busyId === f.id} className="lf-btn lf-btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                              {busyId === f.id ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : "Extend trial"}
                            </button>
                          </Td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No firms match your filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
              MRR assumes {summary ? money(summary.seatPrice) : "$29"}/seat on active plans. Trial figures reflect the 14-day free trial.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="lf-card" style={{ padding: "0.9rem 1rem", borderLeft: accent ? "3px solid var(--gold)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
        <span style={{ width: 14, height: 14, display: "inline-flex" }}>{icon}</span>{label}
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => <th style={{ padding: "0.6rem 0.75rem", fontWeight: 700 }}>{children}</th>;
const Td = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <td style={{ padding: "0.6rem 0.75rem", ...style }}>{children}</td>;
