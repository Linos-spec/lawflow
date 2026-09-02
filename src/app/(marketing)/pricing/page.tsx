"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

/* ────────────────────────────────────────── */
/*  Data                                      */
/* ────────────────────────────────────────── */

// One simple per-seat plan — everything included. Introductory pricing for new firms.
const plan = {
  introPrice: 29,     // new firms, first 6 months
  regularPrice: 49,   // thereafter
  features: [
    "AI intake, conflict checks & qualification",
    "AI case summaries & document drafting",
    "Unlimited cases & clients",
    "Deadlines, billing & invoicing",
    "Client portal — secure messaging & e-signature",
    "Court filing via Linoscore Delivery",
    "CSV import — start with intake only, no migration",
    "Audit log, role-based access & data export",
    "Email support",
  ],
};

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan includes a 14-day free trial with full access to all features. No credit card required to get started.",
  },
  {
    q: "Can I add or remove users?",
    a: "Anytime. Add a seat when someone joins or remove one when they leave, right from your account settings. Billing is prorated, so you only pay for the seats you use.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards including Visa, Mastercard, and American Express. Invoicing is available on request.",
  },
  {
    q: "Is the $29 price permanent?",
    a: "$29 per user/month is an introductory rate for new firms — it applies for your first 6 months. After that, the standard price is $49 per user/month. There's no long-term contract; you can cancel anytime.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, no long-term contracts. You can cancel your subscription at any time from your account settings. Your access continues until the end of your billing period.",
  },
];

/* ────────────────────────────────────────── */
/*  FAQ Item                                  */
/* ────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="lf-btn"
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "1.25rem 0",
          background: "transparent",
          borderRadius: 0,
          fontFamily: "var(--font-heading)",
          fontSize: "1.0625rem",
          fontWeight: 700,
          color: "var(--navy)",
        }}
      >
        <span style={{ textAlign: "left" }}>{q}</span>
        {open ? (
          <ChevronUp style={{ width: 20, height: 20, flexShrink: 0, color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown style={{ width: 20, height: 20, flexShrink: 0, color: "var(--text-muted)" }} />
        )}
      </button>
      {open && (
        <p
          style={{
            padding: "0 0 1.25rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.9375rem",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────── */
/*  Page                                      */
/* ────────────────────────────────────────── */

export default function PricingPage() {

  return (
    <div style={{ background: "var(--bg-base)" }}>
      {/* ── Hero ── */}
      <section
        style={{
          textAlign: "center",
          padding: "5rem 1.5rem 3rem",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            fontWeight: 700,
            color: "var(--navy)",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          Simple, transparent pricing
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
          }}
        >
          No hidden fees. No long-term contracts. Cancel anytime.
        </p>

        {/* Introductory offer */}
        <div className="lf-badge lf-badge-green" style={{ padding: "0.35rem 0.9rem", fontSize: "0.85rem" }}>
          🎉 Introductory pricing for new firms — lock in $29/user for 6 months
        </div>
      </section>

      {/* ── Single plan card ── */}
      <section
        style={{
          maxWidth: 460,
          margin: "0 auto",
          padding: "0 1.5rem 2rem",
        }}
      >
        <div
          className="lf-card"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "2.5rem 2rem",
            borderColor: "var(--gold)",
            borderWidth: 2,
          }}
        >
          <span
            className="lf-badge lf-badge-gold"
            style={{
              position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)",
              display: "inline-flex", alignItems: "center", gap: 4, padding: "0.25rem 0.875rem", fontSize: "0.75rem",
            }}
          >
            <Sparkles style={{ width: 12, height: 12 }} />
            Everything included
          </span>

          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.25rem" }}>
            Linoscore Legal
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            One plan. Every feature. Add a seat for each team member.
          </p>

          {/* Price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "2.75rem", fontWeight: 700, color: "var(--navy)", lineHeight: 1 }}>
                ${plan.introPrice}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--text-muted)" }}>/user /mo</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--text-muted)", textDecoration: "line-through" }}>${plan.regularPrice}</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 6 }}>
              Introductory rate for new firms — your first 6 months. <b style={{ color: "var(--text-secondary)" }}>${plan.regularPrice}/user/mo</b> thereafter.
            </p>
          </div>

          {/* Features */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
            {plan.features.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                <Check style={{ width: 18, height: 18, color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/register" className="lf-btn lf-btn-gold" style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", justifyContent: "center" }}>
            Start free trial
          </Link>
          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
            14 days free · no credit card required
          </p>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
          Larger team or need volume pricing?{" "}
          <a href="mailto:sales@linoscore.com" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>Talk to us</a>.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--navy)",
            textAlign: "center",
            marginBottom: "2.5rem",
          }}
        >
          Frequently asked questions
        </h2>

        <div>
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
