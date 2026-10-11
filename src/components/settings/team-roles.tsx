"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Users, ShieldCheck, UserPlus, Trash2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS, type Role } from "@/lib/rbac";

interface Member { id: string; name: string; email?: string; role: string; }

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

  // Add-user form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "ASSOCIATE" as Role });
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; inviteSent: boolean; inviteLink?: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const removeMember = async (m: Member) => {
    if (!confirm(`Remove ${m.name} from the firm? This frees their seat and revokes access.`)) return;
    setSavingId(m.id);
    try {
      const res = await fetch(`/api/v1/firm/users/${m.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) { toast.error(j.error || "Could not remove user"); return; }
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
      toast.success(`${m.name} removed`);
    } finally { setSavingId(null); }
  };

  const openAdd = () => {
    setForm({ name: "", email: "", role: "ASSOCIATE" });
    setCreated(null);
    setShowAdd(true);
  };

  const addUser = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("Name and email are required"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/v1/firm/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) { toast.error(j.error || "Could not add user"); return; }
      setMembers((prev) => [...prev, j.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCreated({ name: form.name, email: form.email, inviteSent: !!j.data.inviteSent, inviteLink: j.data.inviteLink });
      setShowAdd(false);
      toast.success(j.data.inviteSent ? `Invite emailed to ${form.email}` : `${form.name} added — share the invite link`);
    } finally { setAdding(false); }
  };

  const copyCreds = () => {
    if (!created?.inviteLink) return;
    navigator.clipboard.writeText(`You've been invited to Linoscore Legal. Set your password here: ${created.inviteLink}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lf-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users style={{ width: 18, height: 18, color: "var(--navy)" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>Team &amp; roles</h2>
          {!loading && (
            <span className="lf-badge" style={{ background: "rgba(15,27,51,0.06)", color: "var(--text-secondary)" }}>
              {members.length} {members.length === 1 ? "seat" : "seats"}
            </span>
          )}
        </div>
        <button onClick={openAdd} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.85rem" }}>
          <UserPlus style={{ width: 15, height: 15 }} /> Add user
        </button>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Each team member is a seat on your plan. Roles control who can perform sensitive actions; every change is recorded in the audit log.
      </p>

      {/* Invite confirmation after creating a user */}
      {created && (
        <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: 10, border: "1px solid var(--gold)", background: "var(--gold-bg, #fef3e2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--navy)" }}>
              {created.inviteSent ? `Invite emailed to ${created.name}` : `${created.name} added — share the invite link`}
            </p>
            <button onClick={() => setCreated(null)} className="lf-btn lf-btn-ghost" style={{ padding: "0.2rem" }} aria-label="Dismiss"><X style={{ width: 15, height: 15 }} /></button>
          </div>
          {created.inviteSent ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
              We sent <b style={{ color: "var(--navy)" }}>{created.email}</b> a link to set their password and sign in. The link is valid for 7 days.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                Email couldn&apos;t be sent automatically. Send <b style={{ color: "var(--navy)" }}>{created.email}</b> this link so they can set their password (valid 7 days):
              </p>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6, wordBreak: "break-all", fontFamily: "var(--font-mono, monospace)" }}>{created.inviteLink}</div>
              <button onClick={copyCreds} className="lf-btn lf-btn-outline" style={{ padding: "0.35rem 0.7rem", marginTop: "0.6rem" }}>
                {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />} {copied ? "Copied" : "Copy invite link"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Add-user form */}
      {showAdd && (
        <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-base)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input className="lf-input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="lf-input" type="email" placeholder="name@firm.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="lf-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
            We&apos;ll email them an invite to set their own password and sign in. Each member is a seat on your plan.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "0.75rem" }}>
            <button onClick={() => setShowAdd(false)} className="lf-btn lf-btn-ghost" style={{ padding: "0.45rem 0.85rem" }}>Cancel</button>
            <button onClick={addUser} disabled={adding} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.85rem" }}>
              {adding ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <UserPlus style={{ width: 15, height: 15 }} />} Send invite
            </button>
          </div>
        </div>
      )}

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
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email || ROLE_HELP[m.role as Role]}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {savingId === m.id && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />}
                <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} disabled={savingId === m.id} style={{ padding: "0.4rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.85rem", color: "var(--navy)", background: "var(--bg-card)" }}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                {m.id !== currentUserId && (
                  <button onClick={() => removeMember(m)} disabled={savingId === m.id} className="lf-btn lf-btn-ghost" style={{ padding: "0.35rem", color: "var(--danger)" }} title="Remove user" aria-label={`Remove ${m.name}`}>
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                )}
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
