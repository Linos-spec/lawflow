import Link from "next/link";
import { notFound } from "next/navigation";
import { POLICIES, POLICY_ORDER } from "@/lib/policies";

export function generateStaticParams() {
  return POLICY_ORDER.map((slug) => ({ slug }));
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>
        <Link href="/" style={{ fontSize: "0.85rem", color: "var(--brand)", textDecoration: "none" }}>← Linoscore</Link>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 800, color: "var(--navy)", marginTop: "1rem" }}>{policy.title}</h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>{policy.summary}</p>

        {/* Template notice */}
        <div style={{ marginTop: "1.5rem", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12, padding: "0.9rem 1.1rem" }}>
          <p style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.5 }}>
            <strong>Template — not legal advice.</strong> This document is a starting point provided for convenience. Review and adapt it with qualified counsel to fit your jurisdiction and practice before you rely on or publish it.
          </p>
        </div>

        {/* Policy nav */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}>
          {POLICY_ORDER.map((s) => (
            <Link key={s} href={`/legal/${s}`} style={{ fontSize: "0.82rem", fontWeight: 600, padding: "0.35rem 0.75rem", borderRadius: 999, textDecoration: "none",
              background: s === slug ? "var(--navy)" : "var(--bg-card)", color: s === slug ? "#fff" : "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
              {POLICIES[s].title}
            </Link>
          ))}
        </div>

        {/* Sections */}
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {policy.sections.map((sec) => (
            <section key={sec.heading}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.6rem" }}>{sec.heading}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {sec.body.map((p, i) => (
                  <p key={i} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "3rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
          Questions? Contact privacy@linoscore.com. Linoscore provides software, not legal services.
        </p>
      </div>
    </div>
  );
}
