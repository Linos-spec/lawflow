"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS, type Role } from "@/lib/rbac";

interface Member { id: string; name: string; role: string; }

const ROLES: Role[] = ["ADMIN", "PARTNER", "ASSOCIATE", "PARALEGAL"];

const ROLE_HELP: Record<Role, string> = {
  ADMIN: "Full access — settings, audit log, roles, delete, exports.",
  PARTNER: "Manage matters, billing, delete matters, export client data.",
  ASSOCIATE: "Work matters and documents; no destructive or admin actions.",
  PARALEGAL: "Support matters and documents; most limited.",
};

export function TeamRoles({ currentUserId }: { currentUserId?: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/firm/users");
      const j = await res.json();
      if (j.success) setMembers(j.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const changeRole = async (m: Member, role: string) => {
    setSavingId(m.id);
    try {
      const res = await fetch(`/api/v1/firm/users/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      const j = await res.json();
      if (!res.ok) { toast.error(j.error || "Could not change role"); return; }
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role } : x)));
      toast.success(`${m.name} is now ${ROLE_LABELS[role as Role]}`);
    } catch { toast.error("Could not change role"); }
    finally { setSavingId(null); }
  };

  return (
    <div className="lf-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.25rem" }}>
        <Users style={{ width: 18, height: 18, color: "var(--navy)" }} />
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>Team &amp; roles</h2>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Roles control who can perform sensitive actions. Every change is recorded in the audit log.
      </p>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}><Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.6rem 0.75rem", borderRadius: 8, background: "var(--bg-base)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>{m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--navy)" }}>{m.name}{m.id === currentUserId ? " (you)" : ""}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ROLE_HELP[m.role as Role]}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {savingId === m.id && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />}
                <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} disabled={savingId === m.id} style={{ padding: "0.4rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.85rem", color: "var(--navy)", background: "var(--bg-card)" }}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.9rem" }}>
        <ShieldCheck style={{ width: 13, height: 13 }} /> Your firm must always keep at least one admin.
      </p>
    </div>
  );
}
