import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRACTICE_AREAS, FIRM_SIZES, ROLES, type Segment } from "@/lib/solutions";

export const metadata = {
  title: "Solutions — Linoscore Legal",
  description: "Linoscore Legal for your practice area, firm size, and role.",
};

export default function SolutionsPage() {
  return (
    <main style={{ fontFamily: "var(--font-body)" }}>
      {/* Hero */}
      <section style={{ background: "var(--navy)", color: "#fff", padding: "7rem 1.5rem 3rem", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 800, lineHeight: 1.1 }}>
            Built around how <span style={{ color: "var(--gold-light, #e6c877)" }}>your firm</span> actually works
          </h1>
          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.8)", marginTop: "1rem", lineHeight: 1.6 }}>
            One shared client and matter record, from first inquiry to final invoice. Pick the lens that fits you — we&apos;ll tailor your setup when you request access.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <Section id="practice-areas" eyebrow="By practice area" title="Tuned to your matters"
          desc="Intake questions, conflict checks, templates, and workflows that fit the work you do." items={PRACTICE_AREAS} cols={2} />
        <Section id="firm-size" eyebrow="By firm size" title="Right-sized for your team"
          desc="Start solo and add seats as you grow — the same shared record the whole way." items={FIRM_SIZES} cols={3} />
        <Section id="roles" eyebrow="By role" title="Something for everyone on the team"
          desc="Attorneys, paralegals, and office staff each get a view built for their work." items={ROLES} cols={2} />
      </div>

      {/* CTA */}
      <section style={{ background: "var(--bg-base)", padding: "3rem 1.5rem", textAlign: "center", borderTop: "1px solid var(--border-light)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>Not sure which fits?</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Tell us about your firm and we&apos;ll set you up — new firms get a 14-day free trial after approval.</p>
        <Link href="/register" className="lf-btn lf-btn-gold" style={{ marginTop: "1.25rem", padding: "0.75rem 1.5rem", textDecoration: "none", display: "inline-flex" }}>
          Request access <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </section>
    </main>
  );
}

function Section({ id, eyebrow, title, desc, items, cols }: { id: string; eyebrow: string; title: string; desc: string; items: Segment[]; cols: number }) {
  return (
    <section id={id} style={{ scrollMarginTop: 90, marginBottom: "3.5rem" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)" }}>{eyebrow}</p>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", fontWeight: 800, color: "var(--navy)", marginTop: 4 }}>{title}</h2>
      <p style={{ color: "var(--text-secondary)", marginTop: 6, maxWidth: 640 }}>{desc}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 3 ? 260 : 300}px, 1fr))`, gap: "0.9rem", marginTop: "1.5rem" }}>
        {items.map((s) => (
          <Link key={s.slug} href={`/register?for=${s.slug}`} className="lf-card" style={{ textDecoration: "none", padding: "1.1rem", display: "flex", flexDirection: "column", gap: 6, transition: "transform 0.15s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--navy)", fontSize: "1.02rem" }}>{s.label}</span>
              <ArrowRight style={{ width: 16, height: 16, color: "var(--gold)", flexShrink: 0 }} />
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
