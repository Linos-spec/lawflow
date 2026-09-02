import Link from "next/link";
import { POLICY_ENTITY } from "@/lib/policies";

export const metadata = {
  title: "Security FAQ — Linoscore Legal",
  description: "Plain-language answers to the security questions lawyers ask before uploading privileged client material to Linoscore Legal.",
};

const FAQ: { q: string; a: string }[] = [
  { q: "If I upload privileged client material, who can access it?", a: "Only your firm's own users, according to their role. On our side, access is limited to authorized personnel on a need-to-know basis for operating and supporting the service — we don't read client matter content otherwise. Other firms can never see your data; every firm is isolated as its own tenant." },
  { q: "Where does my data live, and does it leave the US?", a: "It's hosted in the United States (DigitalOcean, New York) — application and database both. Client data does not leave the US. AI processing (Anthropic, OpenAI) also runs in the US." },
  { q: "Do you use my client data to train AI?", a: "No. We never use client matter content to train shared AI models, and our AI providers don't train on data sent through their business APIs. AI only ever sees the specific data needed for a task you trigger, and its output is a draft for your review — nothing reaches a client without an attorney's approval." },
  { q: "Is my data encrypted?", a: "Yes — encrypted in transit with TLS, and encrypted at rest by our managed database and storage providers." },
  { q: "Is there two-factor authentication?", a: "Yes. TOTP two-factor (Google Authenticator, 1Password, Authy) with backup codes, and a firm admin can require it for everyone in the firm." },
  { q: "Can I see who did what?", a: "Yes. An immutable, firm-scoped audit log records logins (and failed logins), record changes, deletions, exports, role changes, and court filings — with timestamps and source IP for sign-ins. Admins can review and export it as CSV." },
  { q: "What happens if there's a security incident?", a: "We notify affected firms without undue delay and within 72 hours of confirming an incident, with what happened and any action needed. You can reach our security contact any time at info@linosconsulting.com." },
  { q: "How long do you keep data, and what about backups?", a: "Backups use a rolling 7-day point-in-time window for disaster recovery. When you delete data it's removed from the live system promptly and purged from backups within about 7 days, after which it's permanently unrecoverable." },
  { q: "Can I get my data out / am I locked in?", a: "You're never locked in. Admins can export all firm data as portable JSON and the audit log as CSV at any time, and can permanently close the account (which deletes your data) on demand." },
  { q: "Do you have SOC 2 or a penetration test?", a: "We don't hold SOC 2 today and we won't claim certifications we don't have. An independent penetration test and SOC 2 readiness are on our roadmap; a pentest summary will be available under NDA once complete." },
  { q: "Can we sign a real agreement and DPA, not just website terms?", a: "Yes. Our Terms, Privacy Policy, and DPA are published in full, and a countersigned DPA and Master Services Agreement are available on request before you onboard." },
  { q: "Can I try it with fake data first?", a: "Yes — we recommend evaluating with fictional matters before entering live client data, and we're happy to set up a walkthrough. Email info@linosconsulting.com to arrange a security call." },
];

export default function SecurityFaqPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
        <Link href="/trust" style={{ fontSize: "0.85rem", color: "var(--brand)", textDecoration: "none" }}>← Trust &amp; Security</Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 800, color: "var(--navy)", marginTop: "1rem" }}>Security FAQ</h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.6 }}>
          Straight answers to what lawyers ask before uploading privileged client material. For the full detail see the <Link href="/trust" style={{ color: "var(--brand)" }}>Trust Center</Link> and the <Link href="/trust/questionnaire" style={{ color: "var(--brand)" }}>security questionnaire</Link>.
        </p>

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {FAQ.map((f) => (
            <div key={f.q}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem" }}>{f.q}</h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{f.a}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
          Still have questions? Email <a href="mailto:info@linosconsulting.com" style={{ color: "var(--brand)" }}>info@linosconsulting.com</a> and we&apos;ll set up a call. {POLICY_ENTITY} provides software, not legal services.
        </p>
      </div>
    </div>
  );
}
