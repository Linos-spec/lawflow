import Link from "next/link";
import { POLICY_ENTITY, POLICY_ENTITY_LOCATION } from "@/lib/policies";

export const metadata = {
  title: "Trust & Security — Linoscore Legal",
  description: "How Linoscore Legal protects privileged client data: architecture, tenant isolation, access controls, encryption, backups, AI-data handling, subprocessors, retention, and incident response.",
};

const SUBPROCESSORS = [
  { name: "DigitalOcean", purpose: "Cloud hosting, managed PostgreSQL database, and file storage", region: "United States (New York)" },
  { name: "Anthropic (Claude)", purpose: "AI features — case summaries, drafting, intake qualification, assistant", region: "United States" },
  { name: "OpenAI", purpose: "Text embeddings for “similar matters” search only (no generative use)", region: "United States" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginTop: "2.25rem" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.6rem" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

export default function TrustPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
        <Link href="/" style={{ fontSize: "0.85rem", color: "var(--brand)", textDecoration: "none" }}>← Linoscore Legal</Link>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.1rem", fontWeight: 800, color: "var(--navy)", marginTop: "1rem" }}>Trust &amp; Security</h1>
        <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.6 }}>
          Linoscore Legal holds privileged client material, so this page answers the questions that matter: <b>who can access it, where it travels, how long it&apos;s retained, and what happens if something goes wrong.</b> Operated by {POLICY_ENTITY}, {POLICY_ENTITY_LOCATION}.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Link href="/trust/faq" className="lf-btn lf-btn-outline" style={{ padding: "0.5rem 0.9rem" }}>Security FAQ</Link>
          <Link href="/trust/questionnaire" className="lf-btn lf-btn-outline" style={{ padding: "0.5rem 0.9rem" }}>Completed security questionnaire</Link>
          <a href="mailto:info@linosconsulting.com" className="lf-btn lf-btn-outline" style={{ padding: "0.5rem 0.9rem" }}>Request a security call</a>
        </div>

        <Section id="residency" title="Where your data lives">
          <p>Your firm&apos;s data — clients, matters, documents, and messages — is hosted on managed cloud infrastructure in the <b>United States (New York)</b>. The application and its PostgreSQL database run in DigitalOcean&apos;s US-East region. <b>Client data does not leave the United States.</b></p>
        </Section>

        <Section id="isolation" title="Tenant isolation">
          <p>Every firm is a separate tenant. All data — every record, document, and query — is scoped to a firm identifier and filtered at the application layer on every request, so one firm can never see or reach another firm&apos;s data.</p>
        </Section>

        <Section id="encryption" title="Encryption">
          <p>All traffic is encrypted in transit with TLS (HTTPS). Data is encrypted at rest by our managed database and storage providers.</p>
        </Section>

        <Section id="access" title="Access controls & production access">
          <p><b>In your firm:</b> role-based access control (Admin, Partner, Associate, Paralegal) governs who can perform sensitive actions — deleting matters, exporting client data, changing roles, and managing billing. Roles are enforced server-side, not just hidden in the UI.</p>
          <p><b>On our side:</b> production access is limited to authorized {POLICY_ENTITY} personnel on a need-to-know basis, over encrypted channels, only to operate and support the service. We do not access client matter content except as needed to provide support you request or to meet a legal obligation.</p>
        </Section>

        <Section id="ai" title="AI data handling">
          <p>AI features (case summaries, document drafting, the assistant, and intake qualification) send the relevant matter data to <b>Anthropic&apos;s Claude</b> API to generate a response. Text embeddings for the optional “similar matters” search use <b>OpenAI</b>. Both are processed in the United States.</p>
          <ul style={{ paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <li><b>No training on your data.</b> We do not use client matter content to train shared AI models, and our AI providers do not train their models on data submitted through their business APIs.</li>
            <li><b>Decision-support only.</b> AI output is a draft or a suggestion; it never reaches a client without an attorney&apos;s review and approval.</li>
            <li><b>Scoped.</b> Only the data needed for a given task is sent — not your entire database.</li>
          </ul>
        </Section>

        <Section id="subprocessors" title="Subprocessors">
          <p>We use a small number of vetted subprocessors to run the service, each under data-protection terms:</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", marginTop: "0.35rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-default)" }}>
                  <th style={{ padding: "0.5rem 0.6rem", color: "var(--text-muted)", fontWeight: 700 }}>Provider</th>
                  <th style={{ padding: "0.5rem 0.6rem", color: "var(--text-muted)", fontWeight: 700 }}>Purpose</th>
                  <th style={{ padding: "0.5rem 0.6rem", color: "var(--text-muted)", fontWeight: 700 }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((s) => (
                  <tr key={s.name} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.55rem 0.6rem", color: "var(--navy)", fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "0.55rem 0.6rem", color: "var(--text-secondary)" }}>{s.purpose}</td>
                    <td style={{ padding: "0.55rem 0.6rem", color: "var(--text-secondary)" }}>{s.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>We do not currently use a third-party email, analytics, or advertising subprocessor. We&apos;ll update this list and notify firms before adding a subprocessor that processes client data.</p>
        </Section>

        <Section id="retention" title="Backups, retention & deletion">
          <p>The managed database takes automated daily backups with point-in-time recovery over a rolling <b>7-day</b> window, used only for disaster recovery.</p>
          <p>When you delete a record, or a client&apos;s data via the in-app export/erase tools, it is removed from the live system promptly and ages out of backups within the backup window (about 7 days), after which it is permanently unrecoverable. On account closure we provide a full export and then delete your firm&apos;s data on the same timeline.</p>
        </Section>

        <Section id="audit" title="Audit logging">
          <p>An immutable, firm-scoped audit log records who did what and when — record creation and deletion, data exports, permission and role changes, and billing changes. Firm admins can inspect it in Settings, and export it for their own records.</p>
        </Section>

        <Section id="portability" title="Your data is portable — no lock-in">
          <p>Firm admins can export client and matter data at any time from within the app, and request a full account export on closure. You are never locked in.</p>
        </Section>

        <Section id="incident" title="Incident response">
          <p>We maintain an incident-response process for security events. If a confirmed incident affects your firm&apos;s data, we will notify you <b>without undue delay — and within 72 hours of confirming the incident</b> — with what we know, what we&apos;re doing, and what (if anything) you should do. Report a concern any time to <a href="mailto:info@linosconsulting.com" style={{ color: "var(--brand)" }}>info@linosconsulting.com</a>.</p>
        </Section>

        <Section id="responsibility" title="Professional-responsibility safeguards">
          <ul style={{ paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <li><b>Attorney approval gate.</b> Nothing the AI produces — engagement letters, drafts, replies — reaches a client until an attorney reviews and sends it. Drafts are labeled as drafts for attorney review.</li>
            <li><b>Conflict checks are a screening aid.</b> The automated conflict check surfaces potential matches against your existing clients and adverse parties; it is not a legal conclusion and does not replace your professional conflict-of-interest analysis.</li>
            <li><b>AI is decision-support, not legal advice.</b> AI features may be incomplete or incorrect; you remain responsible for all professional judgments. We make no claim that AI replaces a lawyer&apos;s judgment.</li>
          </ul>
        </Section>

        <Section id="agreements" title="Agreements">
          <p>Our <Link href="/legal/terms" style={{ color: "var(--brand)" }}>Terms of Service</Link>, <Link href="/legal/privacy" style={{ color: "var(--brand)" }}>Privacy Policy</Link>, and <Link href="/legal/dpa" style={{ color: "var(--brand)" }}>Data Processing Addendum</Link> are published in full. A countersigned DPA and a Master Services Agreement are available on request for firms that require them before onboarding — contact <a href="mailto:info@linosconsulting.com" style={{ color: "var(--brand)" }}>info@linosconsulting.com</a>.</p>
        </Section>

        <Section id="roadmap" title="What we&apos;re working toward">
          <p>We believe in being specific about what is and isn&apos;t in place. Currently on our security roadmap:</p>
          <ul style={{ paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <li><b>Multi-factor authentication (MFA)</b> for firm users and administrators.</li>
            <li><b>An independent penetration test</b>, with a summary available to firms under NDA and critical findings remediated.</li>
            <li><b>SOC 2 readiness.</b> We do not currently hold SOC 2 or other certifications, and we don&apos;t claim any we don&apos;t have.</li>
          </ul>
        </Section>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
          Questions from your security or compliance team? Email <a href="mailto:info@linosconsulting.com" style={{ color: "var(--brand)" }}>info@linosconsulting.com</a> and we&apos;ll set up a call. {POLICY_ENTITY} provides software, not legal services.
        </p>
      </div>
    </div>
  );
}
