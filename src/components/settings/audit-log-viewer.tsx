"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, ScrollText, Download } from "lucide-react";

interface AuditEntry {
  id: string; action: string; category: string; entity: string;
  entityLabel: string | null; details: string | null; actorName: string; createdAt: string;
}

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "data", label: "Data" },
  { key: "access", label: "Access" },
  { key: "auth", label: "Auth" },
  { key: "config", label: "Config" },
];

const categoryColor: Record<string, { bg: string; text: string }> = {
  data: { bg: "#dbeafe", text: "#1e40af" },
  access: { bg: "#ede9fe", text: "#6d28d9" },
  auth: { bg: "#fef3c7", text: "#b45309" },
  config: { bg: "#f1f5f9", text: "#475569" },
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`);
      const j = await res.json();
      if (j.success) setLogs(j.data.logs);
    } finally { setLoading(false); }
  }, [category, q]);

  useEffect(() => { load(); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="lf-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ScrollText style={{ width: 18, height: 18, color: "var(--navy)" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>Audit log</h2>
        </div>
        <a href="/api/v1/audit-logs/export" className="lf-btn lf-btn-outline" style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
          <Download style={{ width: 14, height: 14 }} /> Export CSV
        </a>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Immutable record of activity across your firm — who did what, and when. Read-only.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} className={`lf-pill ${category === c.key ? "lf-pill-active" : ""}`} style={{ fontSize: "0.8rem" }}>{c.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 180, border: "1px solid var(--border-default)", borderRadius: 8, padding: "0.15rem 0.6rem", background: "var(--bg-card)" }}>
          <Search style={{ width: 15, height: 15, color: "var(--text-muted)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search action, record, or person…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", color: "var(--navy)", padding: "0.4rem 0" }} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2.5rem", textAlign: "center" }}><Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
      ) : logs.length === 0 ? (
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", padding: "1.5rem 0", textAlign: "center" }}>No audit entries yet. Activity will appear here as your team works.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {logs.map((l) => {
            const cc = categoryColor[l.category] || categoryColor.data;
            return (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border-light)" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", background: cc.bg, color: cc.text, padding: "0.1rem 0.45rem", borderRadius: 999, flexShrink: 0, minWidth: 58, textAlign: "center" }}>{l.category}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.86rem", color: "var(--navy)" }}><span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}>{l.action}</span>{l.entityLabel ? ` — ${l.entityLabel}` : ""}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{l.actorName}{l.details ? ` · ${l.details}` : ""}</p>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
