import Link from "next/link";
import { POLICY_ENTITY, POLICY_ENTITY_LOCATION } from "@/lib/policies";

export const metadata = {
  title: "Security Questionnaire — Linoscore Legal",
  description: "A completed security questionnaire for Linoscore Legal: architecture, data protection, access control, MFA, AI-data handling, subprocessors, backups, retention, incident response, and compliance.",
};

type QA = { q: string; a: string };
const SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: "Company & scope",
    items: [
      { q: "Who operates the service, and where are you based?", a: `Linoscore Legal is operated by ${POLICY_ENTITY}, a Texas limited liability company based in ${POLICY_ENTITY_LOCATION}. It is a legal practice-management product for law firms.` },
      { q: "What data does the service process?", a: "Firm account data (users, roles), and the client/matter data a firm enters — contacts, matters, documents, deadlines, billing, and messages, including the personal data of the firm's clients and opposing parties. The firm is the data controller; we are the processor." },
    ],
  },
  {
    title: "Data protection & residency",
    items: [
      { q: "Where is data hosted and stored?", a: "On managed cloud infrastructure (DigitalOcean) in the United States — the application and PostgreSQL database run in the US-East (New York) region. Client data does not leave the United States." },
      { q: "Is data encrypted in transit and at rest?", a: "Yes. All traffic is encrypted in transit with TLS (HTTPS). Data is encrypted at rest by our managed database and storage providers." },
      { q: "Is client data isolated between firms?", a: "Yes. Every firm is a separate tenant; all data is scoped to a firm identifier and filtered at the application layer on every request, enforced server-side." },
    ],
  },
  {
    title: "Access control & authentication",
    items: [
      { q: "How is access controlled within a firm?", a: "Role-based access control with four roles (Admin, Partner, Associate, Paralegal). Sensitive actions — deleting matters, exporting data, changing roles, managing billing — are gated by role and enforced server-side." },
      { q: "Do you support multi-factor authentication?", a: "Yes. TOTP-based two-factor authentication (compatible with Google Authenticator, 1Password, Authy) with one-time backup codes. A firm admin can require MFA for all users; unenrolled users are forced to set it up before they can continue." },
      { q: "Who at Linoscore can access client data?", a: "Production access is limited to authorized personnel on a need-to-know basis, over encrypted channels, only to operate and support the service. We do not access client matter content except to provide support you request or to meet a legal obligation." },
    ],
  },
  {
    title: "AI & subprocessors",
    items: [
      { q: "Which AI providers receive data, and for what?", a: "Anthropic (Claude) for summaries, drafting, the assistant, and intake qualification; OpenAI for text embeddings used only by the optional 'similar matters' search. Both process data in the United States." },
      { q: "Is our data used to train AI models?", a: "No. We do not use client matter content to train shared AI models, and our AI providers do not train their models on data submitted through their business APIs." },
      { q: "Who are your subprocessors?", a: "DigitalOcean (hosting, database, storage), Anthropic (AI features), and OpenAI (embeddings) — all in the United States. We do not currently use a third-party email, analytics, or advertising subprocessor. The current list is published at /trust and we notify firms before adding a subprocessor that processes client data." },
    ],
  },
  {
    title: "Backups, retention & deletion",
    items: [
      { q: "How are backups handled?", a: "The managed database takes automated daily backups with point-in-time recovery over a rolling 7-day window, used only for disaster recovery." },
      { q: "What happens when data is deleted?", a: "Deleted records are removed from the live system promptly and age out of backups within the backup window (about 7 days), after which they are permanently unrecoverable." },
      { q: "Can a firm export its data and close its account?", a: "Yes. Admins can export all firm data (portable JSON) and the audit log (CSV) at any time, and can permanently close the account — which deletes the firm and all its data. Firms are never locked in." },
    ],
  },
  {
    title: "Auditability & monitoring",
    items: [
      { q: "Do you keep an audit log firms can review?", a: "Yes. An immutable, firm-scoped audit log records authentication events (including failed sign-ins), record creation and deletion, data exports, permission and role changes, billing changes, and courier/court filings — who, what, when, and the source IP for logins. Admins can inspect and export it." },
    ],
  },
  {
    title: "Incident response",
    items: [
      { q: "What is your breach-notification commitment?", a: "We maintain an incident-response process. If a confirmed incident affects a firm's data, we notify the firm without undue delay and within 72 hours of confirming the incident, with what we know, what we're doing, and any action needed. Concerns: security@linoscore.com." },
    ],
  },
  {
    title: "Professional responsibility",
    items: [
      { q: "Does AI output ever reach a client automatically?", a: "No. Every AI output — engagement letters, drafts, replies — requires an attorney's review and approval before it is sent; drafts are labeled as drafts. The automated conflict check is a screening aid, not a legal conclusion. AI is decision-support and does not replace a lawyer's professional judgment." },
    ],
  },
  {
    title: "Compliance & agreements",
    items: [
      { q: "Do you hold SOC 2 or other certifications?", a: "Not currently, and we do not claim any we do not hold. An independent penetration test and SOC 2 readiness are on our roadmap; a pentest summary will be available to firms under NDA once completed." },
      { q: "Can we sign a DPA and a Master Services Agreement?", a: "Yes. Our Terms, Privacy Policy, and Data Processing Addendum are published in full, and a countersigned DPA and MSA are available on request before onboarding. Contact security@linoscore.com." },
    ],
  },
];

export default function QuestionnairePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
        <Link href="/trust" style={{ fontSize: "0.85rem", color: "var(--brand)", textDecoration: "none" }}>← Trust &amp; Security</Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 800, color: "var(--navy)", marginTop: "1rem" }}>Security questionnaire</h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.6 }}>
          A completed questionnaire covering the questions security and compliance teams ask before entrusting privileged client data. Current as of the effective date on our <Link href="/trust" style={{ color: "var(--brand)" }}>Trust Center</Link>. For a version signed and returned on your own template, email <a href="mailto:security@linoscore.com" style={{ color: "var(--brand)" }}>security@linoscore.com</a>.
        </p>

        {SECTIONS.map((sec) => (
          <section key={sec.title} style={{ marginTop: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem", paddingBottom: "0.4rem", borderBottom: "2px solid var(--gold)" }}>{sec.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sec.items.map((it) => (
                <div key={it.q}>
                  <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.25rem" }}>{it.q}</p>
                  <p style={{ fontSize: "0.93rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{it.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
          {POLICY_ENTITY} provides software, not legal services. Questions? <a href="mailto:security@linoscore.com" style={{ color: "var(--brand)" }}>security@linoscore.com</a>.
        </p>
      </div>
    </div>
  );
}
