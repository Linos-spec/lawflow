"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Building2, Pencil,
  Briefcase, FileText, DollarSign, CalendarClock, UserPlus, Clock, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  CLIENT_TYPE_LABELS, CASE_STATUS_LABELS, CASE_TYPE_LABELS,
  DEADLINE_TYPE_LABELS, PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { DOC_TYPE_LABELS } from "@/lib/doc-display";

interface Overview {
  client: {
    id: string; name: string; email: string | null; phone: string | null;
    address: string | null; clientType: string; company: string | null;
    notes: string | null; createdAt: string;
  };
  stats: {
    totalCases: number; activeCases: number; documents: number;
    lifetimeBilled: number; totalPaid: number; outstanding: number;
    hoursLogged: number; openDeadlines: number;
  };
  cases: { id: string; caseNumber: string; title: string; status: string; caseType: string; priority: string; filingDate: string | null }[];
  documents: { id: string; title: string; documentType: string; signatureStatus: string; updatedAt: string; caseId: string | null }[];
  invoices: { id: string; invoiceNumber: string; totalAmount: number; paidAmount: number; paymentStatus: string; issueDate: string; dueDate: string | null }[];
  deadlines: { id: string; title: string; dueDate: string; deadlineType: string; status: string; priority: string; caseId: string; caseTitle: string | null }[];
  intake: { id: string; prospectName: string; caseType: string; status: string; createdAt: string }[];
}

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ClientOverviewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/overview`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error("Client not found");
    } catch { toast.error("Failed to load client"); }
    finally { setLoading(false); }
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--brand)" }} /></div>;
  if (!data) return <div style={{ padding: "2rem" }}>Client not found. <Link href="/clients" style={{ color: "var(--brand)" }}>Back to clients</Link></div>;

  const { client, stats } = data;

  const statCards = [
    { label: "Active cases", value: `${stats.activeCases}`, sub: `${stats.totalCases} total`, icon: Briefcase, color: "var(--brand)" },
    { label: "Outstanding", value: money(stats.outstanding), sub: `${money(stats.lifetimeBilled)} billed`, icon: DollarSign, color: stats.outstanding > 0 ? "var(--warning)" : "var(--success)" },
    { label: "Collected", value: money(stats.totalPaid), sub: "lifetime", icon: DollarSign, color: "var(--success)" },
    { label: "Hours logged", value: `${stats.hoursLogged}`, sub: "across cases", icon: Clock, color: "var(--navy)" },
    { label: "Documents", value: `${stats.documents}`, sub: "on file", icon: FileText, color: "var(--brand)" },
    { label: "Open deadlines", value: `${stats.openDeadlines}`, sub: "pending", icon: CalendarClock, color: stats.openDeadlines > 0 ? "var(--danger)" : "var(--text-muted)" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      <Link href="/clients" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem", textDecoration: "none" }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to clients
      </Link>

      {/* Header */}
      <div className="lf-card" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem", flexShrink: 0 }}>
          {getInitials(client.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>{client.name}</h1>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, background: "var(--secondary)", color: "var(--text-secondary)", padding: "0.15rem 0.6rem", borderRadius: 999 }}>{CLIENT_TYPE_LABELS[client.clientType] || client.clientType}</span>
          </div>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.625rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {client.company && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Building2 style={{ width: 14, height: 14 }} />{client.company}</span>}
            {client.email && <a href={`mailto:${client.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", textDecoration: "none" }}><Mail style={{ width: 14, height: 14 }} />{client.email}</a>}
            {client.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Phone style={{ width: 14, height: 14 }} />{client.phone}</span>}
            {client.address && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin style={{ width: 14, height: 14 }} />{client.address}</span>}
          </div>
        </div>
        <button onClick={() => router.push(`/clients/${clientId}/edit`)} className="lf-btn lf-btn-outline" style={{ padding: "0.5rem 0.875rem" }}>
          <Pencil style={{ width: 15, height: 15 }} /> Edit
        </button>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {statCards.map((s) => (
          <div key={s.label} className="lf-card" style={{ padding: "1rem 1.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
              <s.icon style={{ width: 14, height: 14, color: s.color }} /> {s.label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", marginTop: 4, fontFamily: "var(--font-heading)" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <Section title="Cases" icon={Briefcase} count={data.cases.length} empty="No cases yet.">
          {data.cases.map((c) => (
            <Row key={c.id} onClick={() => router.push(`/cases/${c.id}`)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.caseNumber} · {CASE_TYPE_LABELS[c.caseType] || c.caseType}</div>
              </div>
              <Pill>{CASE_STATUS_LABELS[c.status] || c.status}</Pill>
            </Row>
          ))}
        </Section>

        <Section title="Documents" icon={FileText} count={data.documents.length} empty="No documents on file.">
          {data.documents.map((d) => (
            <Row key={d.id} onClick={() => router.push(`/documents/${d.id}`)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{DOC_TYPE_LABELS[d.documentType] || d.documentType} · {date(d.updatedAt)}</div>
              </div>
              {d.signatureStatus === "PENDING" && <Pill tone="warning">Needs sig</Pill>}
            </Row>
          ))}
        </Section>

        <Section title="Billing" icon={DollarSign} count={data.invoices.length} empty="No invoices yet.">
          {data.invoices.map((i) => (
            <Row key={i.id}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--navy)" }}>{i.invoiceNumber}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{money(i.totalAmount)} · {date(i.issueDate)}</div>
              </div>
              <Pill tone={i.paymentStatus === "PAID" ? "success" : ["OVERDUE", "OUTSTANDING"].includes(i.paymentStatus) ? "danger" : "default"}>{PAYMENT_STATUS_LABELS[i.paymentStatus] || i.paymentStatus}</Pill>
            </Row>
          ))}
        </Section>

        <Section title="Upcoming deadlines" icon={CalendarClock} count={data.deadlines.length} empty="No open deadlines.">
          {data.deadlines.map((d) => (
            <Row key={d.id} onClick={() => router.push(`/cases/${d.caseId}`)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{DEADLINE_TYPE_LABELS[d.deadlineType] || d.deadlineType}{d.caseTitle ? ` · ${d.caseTitle}` : ""}</div>
              </div>
              <Pill tone={d.status === "OVERDUE" ? "danger" : "warning"}>{date(d.dueDate)}</Pill>
            </Row>
          ))}
        </Section>

        {data.intake.length > 0 && (
          <Section title="Intake history" icon={UserPlus} count={data.intake.length} empty="">
            {data.intake.map((i) => (
              <Row key={i.id}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--navy)" }}>{CASE_TYPE_LABELS[i.caseType] || i.caseType}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{date(i.createdAt)}</div>
                </div>
                <Pill>{i.status}</Pill>
              </Row>
            ))}
          </Section>
        )}

        {client.notes && (
          <div className="lf-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "var(--gold)" }} /> Notes
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, count, empty, children }: { title: string; icon: React.ElementType; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className="lf-card" style={{ padding: "1.25rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.875rem" }}>
        <Icon style={{ width: 16, height: 16, color: "var(--brand)" }} /> {title}
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", background: "var(--secondary)", borderRadius: 999, padding: "0.05rem 0.5rem" }}>{count}</span>
      </h3>
      {count === 0 ? <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{empty}</p> : <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</div>}
    </div>
  );
}

function Row({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.55rem 0.5rem", borderRadius: 8, cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = "var(--bg-base)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warning" | "danger" }) {
  const tones: Record<string, { bg: string; c: string }> = {
    default: { bg: "var(--secondary)", c: "var(--text-secondary)" },
    success: { bg: "var(--success-bg)", c: "var(--success)" },
    warning: { bg: "var(--warning-bg)", c: "var(--warning)" },
    danger: { bg: "var(--danger-bg)", c: "var(--danger)" },
  };
  const t = tones[tone];
  return <span style={{ fontSize: "0.7rem", fontWeight: 600, background: t.bg, color: t.c, padding: "0.12rem 0.55rem", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{children}</span>;
}
