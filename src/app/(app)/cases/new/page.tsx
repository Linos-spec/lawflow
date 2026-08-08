"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, ShieldAlert, ShieldQuestion,
  AlertTriangle, UserPlus, Users, Building2, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PRACTICE_AREAS_BY_GROUP, practiceAreaLabel } from "@/lib/practice-areas/catalog";

const DRAFT_KEY = "lf:new-case-draft:v1";

const STEPS = ["Client", "Matter details", "Key dates", "Billing", "Review"];

type Client = { id: string; name: string; clientType: string };
type FirmUser = { id: string; name: string; role: string };

type Form = {
  clientMode: "existing" | "new";
  clientId: string; clientName: string;
  newClientName: string; newClientType: string;
  conflict: { status: string; matchCount: number } | null;
  title: string; caseType: string; matterSubtype: string; caseNumber: string; description: string;
  responsibleAttorneyId: string; assignedTeamIds: string[]; jurisdiction: string; courtName: string;
  openedDate: string; filingDate: string; statuteOfLimitations: string;
  nextDeadlineTitle: string; nextDeadlineDate: string; reminderRule: string;
  billingType: string; hourlyRate: string; flatFee: string; contingencyPct: string;
  retainerAmount: string; engagementLetterStatus: string; trustAccount: boolean;
};

const EMPTY: Form = {
  clientMode: "existing", clientId: "", clientName: "",
  newClientName: "", newClientType: "INDIVIDUAL", conflict: null,
  title: "", caseType: "CIVIL", matterSubtype: "", caseNumber: "", description: "",
  responsibleAttorneyId: "", assignedTeamIds: [], jurisdiction: "", courtName: "",
  openedDate: "", filingDate: "", statuteOfLimitations: "",
  nextDeadlineTitle: "", nextDeadlineDate: "", reminderRule: "7",
  billingType: "", hourlyRate: "", flatFee: "", contingencyPct: "",
  retainerAmount: "", engagementLetterStatus: "NOT_STARTED", trustAccount: false,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.55rem 0.7rem", borderRadius: 8,
  border: "1px solid var(--border-default)", fontSize: "0.9rem", color: "var(--navy)", background: "var(--bg-card)",
};
function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>{children}</label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

export default function NewCaseWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<FirmUser[]>([]);
  const [clientQuery, setClientQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const restored = useRef(false);

  // Restore any autosaved draft, then load clients + team.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { setForm({ ...EMPTY, ...JSON.parse(raw) }); restored.current = true; }
    } catch { /* ignore */ }
    fetch("/api/v1/clients?limit=200").then((r) => r.json()).then((j) => { if (j.success) setClients(j.data); }).catch(() => {});
    fetch("/api/v1/firm/users").then((r) => r.json()).then((j) => { if (j.success) setUsers(j.data); }).catch(() => {});
  }, []);
  useEffect(() => { if (restored.current) { toast("Draft restored"); restored.current = false; } }, []);

  // Autosave to localStorage on every change.
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form]);

  const set = useCallback(<K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v })), []);

  const effectiveClientName = form.clientMode === "existing" ? form.clientName : form.newClientName;

  const runConflict = async () => {
    if (!effectiveClientName.trim()) { toast.error("Enter or pick a client first"); return; }
    setChecking(true);
    try {
      const res = await fetch("/api/v1/conflicts/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: effectiveClientName }),
      });
      const j = await res.json();
      if (j.success) set("conflict", { status: j.data.status, matchCount: j.data.matchCount });
      else toast.error("Conflict check failed");
    } catch { toast.error("Conflict check failed"); }
    finally { setChecking(false); }
  };

  const canProceed = (): boolean => {
    if (step === 0) return form.clientMode === "existing" ? !!form.clientId : !!form.newClientName.trim();
    if (step === 1) return !!form.title.trim();
    return true;
  };

  const ensureClient = async (): Promise<string | null> => {
    if (form.clientMode === "existing") return form.clientId || null;
    const res = await fetch("/api/v1/clients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.newClientName, clientType: form.newClientType }),
    });
    const j = await res.json();
    if (!res.ok || !j.success) { toast.error(j.error || "Could not create client"); return null; }
    return j.data.id;
  };

  const submit = async (withDocuments: boolean) => {
    if (!form.title.trim()) { toast.error("Matter title is required"); setStep(1); return; }
    setBusy(true);
    try {
      const clientId = await ensureClient();
      if (!clientId) return;
      const payload: Record<string, unknown> = {
        clientId, title: form.title, caseType: form.caseType, status: "OPEN",
        matterSubtype: form.matterSubtype || undefined, caseNumber: form.caseNumber || undefined,
        description: form.description || undefined, jurisdiction: form.jurisdiction || undefined,
        courtName: form.courtName || undefined, responsibleAttorneyId: form.responsibleAttorneyId || undefined,
        assignedTeamIds: form.assignedTeamIds, openedDate: form.openedDate || undefined,
        filingDate: form.filingDate || undefined, statuteOfLimitations: form.statuteOfLimitations || undefined,
        billingType: form.billingType || undefined, hourlyRate: form.hourlyRate || undefined,
        flatFee: form.flatFee || undefined, contingencyPct: form.contingencyPct || undefined,
        retainerAmount: form.retainerAmount || undefined, engagementLetterStatus: form.engagementLetterStatus || undefined,
        trustAccount: form.trustAccount,
      };
      const res = await fetch("/api/v1/cases", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.success) { toast.error(j.error || "Could not create the case"); return; }
      const caseId = j.data.id;

      // Optional first deadline.
      if (form.nextDeadlineDate) {
        await fetch("/api/v1/deadlines", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId, title: form.nextDeadlineTitle || "Next deadline",
            dueDate: new Date(form.nextDeadlineDate).toISOString(), deadlineType: "OTHER",
          }),
        }).catch(() => {});
      }

      localStorage.removeItem(DRAFT_KEY);
      toast.success("Case created");
      router.push(`/cases/${caseId}`);
      if (withDocuments) toast("Upload documents from the case page.");
    } catch { toast.error("Could not create the case"); }
    finally { setBusy(false); }
  };

  const saveDraft = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    toast.success("Draft saved — you can finish later");
    router.push("/cases");
  };

  const filteredClients = clients.filter((c) => !clientQuery || c.name.toLowerCase().includes(clientQuery.toLowerCase()));

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header + stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <Link href="/cases" style={{ color: "var(--text-muted)" }}><ArrowLeft style={{ width: 18, height: 18 }} /></Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>New case</h1>
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem", paddingLeft: "1.9rem" }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      {/* Progress steps */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 999, background: i <= step ? "var(--gold)" : "var(--border-default)" }} />
            <div style={{ fontSize: "0.72rem", marginTop: 5, color: i === step ? "var(--navy)" : "var(--text-muted)", fontWeight: i === step ? 700 : 500 }}>{s}</div>
          </div>
        ))}
      </div>

      <div className="lf-card" style={{ padding: "1.5rem" }}>
        {/* STEP 1 — CLIENT */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => set("clientMode", "existing")} className={`lf-btn ${form.clientMode === "existing" ? "lf-btn-gold" : "lf-btn-outline"}`} style={{ flex: 1 }}><Users style={{ width: 15, height: 15 }} /> Existing client</button>
              <button onClick={() => set("clientMode", "new")} className={`lf-btn ${form.clientMode === "new" ? "lf-btn-gold" : "lf-btn-outline"}`} style={{ flex: 1 }}><UserPlus style={{ width: 15, height: 15 }} /> New client</button>
            </div>

            {form.clientMode === "existing" ? (
              <div>
                <Field label="Select client">
                  <input placeholder="Search clients…" value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} style={inputStyle} />
                </Field>
                <div style={{ marginTop: "0.5rem", maxHeight: 220, overflowY: "auto", border: "1px solid var(--border-light)", borderRadius: 8 }}>
                  {filteredClients.length === 0 ? (
                    <p style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>No clients found. Switch to “New client” to add one.</p>
                  ) : filteredClients.map((c) => (
                    <button key={c.id} onClick={() => { set("clientId", c.id); set("clientName", c.name); set("conflict", null); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", textAlign: "left", padding: "0.6rem 0.75rem", border: "none", borderBottom: "1px solid var(--border-light)", cursor: "pointer", background: form.clientId === c.id ? "var(--bg-base)" : "transparent", boxShadow: form.clientId === c.id ? "inset 3px 0 0 var(--gold)" : undefined }}>
                      {c.clientType === "INDIVIDUAL" ? <UserIcon style={{ width: 15, height: 15, color: "var(--text-muted)" }} /> : <Building2 style={{ width: 15, height: 15, color: "var(--text-muted)" }} />}
                      <span style={{ fontSize: "0.88rem", color: "var(--navy)", fontWeight: 500 }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Field label="Client name"><input value={form.newClientName} onChange={(e) => { set("newClientName", e.target.value); set("conflict", null); }} placeholder="Full legal name or organization" style={inputStyle} /></Field>
                <Field label="Client type">
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[["INDIVIDUAL", "Individual"], ["BUSINESS_ENTITY", "Organization"]].map(([v, l]) => (
                      <button key={v} onClick={() => set("newClientType", v)} className={`lf-btn ${form.newClientType === v ? "lf-btn-gold" : "lf-btn-outline"}`} style={{ flex: 1 }}>{l}</button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* Conflict check */}
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)" }}>Conflict check</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Screen this client against your existing clients, matters, and adverse parties.</p>
                </div>
                <button onClick={runConflict} disabled={checking} className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.9rem" }}>
                  {checking ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <ShieldQuestion style={{ width: 15, height: 15 }} />} Run check
                </button>
              </div>
              {form.conflict && (
                <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, color: form.conflict.status === "CLEAR" ? "var(--success)" : form.conflict.status === "PENDING" ? "var(--text-muted)" : "var(--danger)" }}>
                  {form.conflict.status === "CLEAR" ? <ShieldCheck style={{ width: 16, height: 16 }} /> : <ShieldAlert style={{ width: 16, height: 16 }} />}
                  {form.conflict.status === "CLEAR" ? "No conflicts found" : `${form.conflict.matchCount} potential match(es) — review before proceeding`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — MATTER DETAILS */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1 / -1" }}><Field label="Case / matter title *"><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Martinez v. Acme Corp" style={inputStyle} /></Field></div>
            <Field label="Practice area">
              <select value={form.caseType} onChange={(e) => set("caseType", e.target.value)} style={inputStyle}>
                {PRACTICE_AREAS_BY_GROUP.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.areas.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Matter type"><input value={form.matterSubtype} onChange={(e) => set("matterSubtype", e.target.value)} placeholder="e.g. Wrongful termination" style={inputStyle} /></Field>
            <Field label="Internal case number"><input value={form.caseNumber} onChange={(e) => set("caseNumber", e.target.value)} placeholder="Auto-generated if blank" style={inputStyle} /></Field>
            <Field label="Office / jurisdiction"><input value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} placeholder="e.g. California — Los Angeles" style={inputStyle} /></Field>
            <div style={{ gridColumn: "1 / -1" }}><Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Brief description of the matter" style={{ ...inputStyle, resize: "vertical" }} /></Field></div>
            <Field label="Responsible attorney">
              <select value={form.responsibleAttorneyId} onChange={(e) => set("responsibleAttorneyId", e.target.value)} style={inputStyle}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Court or agency (optional)"><input value={form.courtName} onChange={(e) => set("courtName", e.target.value)} placeholder="e.g. USCIS, Superior Court" style={inputStyle} /></Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Supporting team</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {users.length === 0 && <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No other team members yet.</span>}
                {users.map((u) => {
                  const on = form.assignedTeamIds.includes(u.id);
                  return <button key={u.id} onClick={() => set("assignedTeamIds", on ? form.assignedTeamIds.filter((x) => x !== u.id) : [...form.assignedTeamIds, u.id])} className={`lf-btn ${on ? "lf-btn-gold" : "lf-btn-outline"}`} style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{u.name}</button>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — KEY DATES */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--warning-bg, #fef3c7)", border: "1px solid #fcd34d", borderRadius: 10, padding: "0.7rem 0.85rem" }}>
              <AlertTriangle style={{ width: 17, height: 17, color: "var(--warning, #b45309)", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: "0.82rem", color: "#92400e" }}><strong>Verify every date.</strong> Dates entered here — and any the AI suggests — must be confirmed against the governing court rules and the official record. Linoscore is not legal advice.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Date opened"><input type="date" value={form.openedDate} onChange={(e) => set("openedDate", e.target.value)} style={inputStyle} /></Field>
              <Field label="Incident or filing date"><input type="date" value={form.filingDate} onChange={(e) => set("filingDate", e.target.value)} style={inputStyle} /></Field>
              <Field label="Statute-of-limitations date"><input type="date" value={form.statuteOfLimitations} onChange={(e) => set("statuteOfLimitations", e.target.value)} style={inputStyle} /></Field>
              <Field label="Reminder rule">
                <select value={form.reminderRule} onChange={(e) => set("reminderRule", e.target.value)} style={inputStyle}>
                  <option value="0">No reminder</option><option value="1">1 day before</option>
                  <option value="3">3 days before</option><option value="7">7 days before</option><option value="14">14 days before</option>
                </select>
              </Field>
            </div>
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Next deadline (optional)"><input value={form.nextDeadlineTitle} onChange={(e) => set("nextDeadlineTitle", e.target.value)} placeholder="e.g. Answer due" style={inputStyle} /></Field>
              <Field label="Next deadline date"><input type="date" value={form.nextDeadlineDate} onChange={(e) => set("nextDeadlineDate", e.target.value)} style={inputStyle} /></Field>
            </div>
          </div>
        )}

        {/* STEP 4 — BILLING */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Billing arrangement">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[["HOURLY", "Hourly"], ["FLAT_FEE", "Flat fee"], ["CONTINGENCY", "Contingency"]].map(([v, l]) => (
                  <button key={v} onClick={() => set("billingType", form.billingType === v ? "" : v)} className={`lf-btn ${form.billingType === v ? "lf-btn-gold" : "lf-btn-outline"}`} style={{ flex: 1 }}>{l}</button>
                ))}
              </div>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {form.billingType === "HOURLY" && <Field label="Hourly rate ($)"><input type="number" value={form.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} placeholder="e.g. 350" style={inputStyle} /></Field>}
              {form.billingType === "FLAT_FEE" && <Field label="Flat fee ($)"><input type="number" value={form.flatFee} onChange={(e) => set("flatFee", e.target.value)} placeholder="e.g. 2500" style={inputStyle} /></Field>}
              {form.billingType === "CONTINGENCY" && <Field label="Contingency (%)"><input type="number" value={form.contingencyPct} onChange={(e) => set("contingencyPct", e.target.value)} placeholder="e.g. 33" style={inputStyle} /></Field>}
              <Field label="Retainer amount ($)"><input type="number" value={form.retainerAmount} onChange={(e) => set("retainerAmount", e.target.value)} placeholder="e.g. 5000" style={inputStyle} /></Field>
              <Field label="Engagement letter">
                <select value={form.engagementLetterStatus} onChange={(e) => set("engagementLetterStatus", e.target.value)} style={inputStyle}>
                  <option value="NOT_STARTED">Not started</option><option value="SENT">Sent</option><option value="SIGNED">Signed</option>
                </select>
              </Field>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "var(--navy)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.trustAccount} onChange={(e) => set("trustAccount", e.target.checked)} />
              Retainer held in a client trust (IOLTA) account
            </label>
          </div>
        )}

        {/* STEP 5 — REVIEW */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <ReviewRow label="Client" value={`${effectiveClientName || "—"}${form.clientMode === "new" ? " (new)" : ""}`} />
            {form.conflict && <ReviewRow label="Conflict" value={form.conflict.status === "CLEAR" ? "No conflicts" : `${form.conflict.matchCount} potential match(es)`} warn={form.conflict.status !== "CLEAR"} />}
            <ReviewRow label="Matter" value={form.title || "—"} />
            <ReviewRow label="Practice area" value={practiceAreaLabel(form.caseType)} />
            {form.matterSubtype && <ReviewRow label="Matter type" value={form.matterSubtype} />}
            <ReviewRow label="Case number" value={form.caseNumber || "Auto-generated"} />
            {form.jurisdiction && <ReviewRow label="Jurisdiction" value={form.jurisdiction} />}
            <ReviewRow label="Responsible attorney" value={users.find((u) => u.id === form.responsibleAttorneyId)?.name || "Unassigned"} />
            {(form.openedDate || form.filingDate || form.statuteOfLimitations) && (
              <ReviewRow label="Key dates" value={[form.openedDate && `Opened ${form.openedDate}`, form.filingDate && `Filing ${form.filingDate}`, form.statuteOfLimitations && `SOL ${form.statuteOfLimitations}`].filter(Boolean).join(" · ")} />
            )}
            {form.billingType && <ReviewRow label="Billing" value={`${form.billingType === "HOURLY" ? `Hourly $${form.hourlyRate || "—"}` : form.billingType === "FLAT_FEE" ? `Flat $${form.flatFee || "—"}` : `Contingency ${form.contingencyPct || "—"}%`}${form.retainerAmount ? ` · retainer $${form.retainerAmount}` : ""}`} />}
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Progress is saved automatically. You can leave and return to this draft anytime.</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
              <button onClick={() => submit(false)} disabled={busy} className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 1.25rem" }}>{busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Check style={{ width: 16, height: 16 }} />} Create case</button>
              <button onClick={() => submit(true)} disabled={busy} className="lf-btn lf-btn-outline" style={{ padding: "0.6rem 1.25rem" }}>Create &amp; upload documents</button>
              <button onClick={saveDraft} disabled={busy} className="lf-btn lf-btn-ghost" style={{ padding: "0.6rem 1rem" }}>Save as draft</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      {step < 4 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <button onClick={() => (step === 0 ? router.push("/cases") : setStep(step - 1))} className="lf-btn lf-btn-ghost" style={{ padding: "0.55rem 1rem" }}><ArrowLeft style={{ width: 15, height: 15 }} /> {step === 0 ? "Cancel" : "Back"}</button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={saveDraft} className="lf-btn lf-btn-outline" style={{ padding: "0.55rem 1rem" }}>Save draft</button>
            <button onClick={() => canProceed() ? setStep(step + 1) : toast.error(step === 0 ? "Choose or add a client" : "Enter a matter title")} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 1.25rem" }}>Next <ArrowRight style={{ width: 15, height: 15 }} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-light)" }}>
      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: "0.86rem", color: warn ? "var(--danger)" : "var(--navy)", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
