"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

/* ────────────────────────────────────────── */
/*  Data                                      */
/* ────────────────────────────────────────── */

const tiers = [
  {
    name: "Starter",
    description: "For solo practitioners",
    monthlyPrice: 49,
    annualPrice: 39,
    features: [
      "Up to 25 active cases",
      "1 user",
      "Client management",
      "Deadline tracking",
      "Basic reporting",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/register",
    style: "outline" as const,
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For growing firms",
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      "Unlimited cases",
      "Up to 10 users",
      "Everything in Starter",
      "Billing & invoicing",
      "Client intake forms",
      "Priority support",
      "Custom case numbering",
    ],
    cta: "Start Free Trial",
    href: "/register",
    style: "gold" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large practices",
    monthlyPrice: 199,
    annualPrice: 159,
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Advanced reporting",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@lawflow.app",
    style: "navy" as const,
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan includes a 14-day free trial with full access to all features. No credit card required to get started.",
  },
  {
    q: "Can I switch plans?",
    a: "Absolutely. Upgrade or downgrade anytime from your account settings. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards including Visa, Mastercard, and American Express. Invoicing is available for annual Enterprise plans.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes, save up to 20% with annual billing compared to monthly pricing. The discount is applied automatically when you choose an annual plan.",
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
  const [annual, setAnnual] = useState(true);

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

        {/* Toggle */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.9375rem",
            fontWeight: 500,
          }}
        >
          <span style={{ color: !annual ? "var(--navy)" : "var(--text-muted)" }}>Monthly</span>
          <button
            aria-label="Toggle annual billing"
            onClick={() => setAnnual(!annual)}
            className={`lf-toggle ${annual ? "active" : ""}`}
          />
          <span style={{ color: annual ? "var(--navy)" : "var(--text-muted)" }}>Annual</span>
          {annual && (
            <span
              className="lf-badge lf-badge-green"
              style={{ marginLeft: 4 }}
            >
              Save 20%
            </span>
          )}
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section
        style={{
          maxWidth: 1140,
          margin: "0 auto",
          padding: "0 1.5rem 5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          alignItems: "center",
        }}
      >
        {tiers.map((tier) => {
          const price = annual ? tier.annualPrice : tier.monthlyPrice;

          return (
            <div
              key={tier.name}
              className="lf-card"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                padding: tier.highlighted ? "2.5rem 2rem" : "2rem",
                borderColor: tier.highlighted ? "var(--gold)" : undefined,
                borderWidth: tier.highlighted ? 2 : undefined,
                transform: tier.highlighted ? "scale(1.04)" : undefined,
                zIndex: tier.highlighted ? 1 : 0,
              }}
            >
              {/* Most Popular badge */}
              {tier.highlighted && (
                <span
                  className="lf-badge lf-badge-gold"
                  style={{
                    position: "absolute",
                    top: "-0.75rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0.25rem 0.875rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <Sparkles style={{ width: 12, height: 12 }} />
                  Most Popular
                </span>
              )}

              {/* Tier heading */}
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--navy)",
                  marginBottom: "0.25rem",
                }}
              >
                {tier.name}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1.5rem",
                }}
              >
                {tier.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: "1.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2.75rem",
                    fontWeight: 700,
                    color: "var(--navy)",
                    lineHeight: 1,
                  }}
                >
                  ${price}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    color: "var(--text-muted)",
                    marginLeft: 4,
                  }}
                >
                  /mo
                </span>
                {annual && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  flex: 1,
                }}
              >
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9375rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Check
                      style={{
                        width: 18,
                        height: 18,
                        color: "var(--success)",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.href.startsWith("mailto:") ? (
                <a
                  href={tier.href}
                  className={`lf-btn ${
                    tier.style === "gold"
                      ? "lf-btn-gold"
                      : tier.style === "navy"
                      ? "lf-btn-primary"
                      : "lf-btn-outline"
                  }`}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "0.9375rem",
                  }}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.href}
                  className={`lf-btn ${
                    tier.style === "gold"
                      ? "lf-btn-gold"
                      : tier.style === "navy"
                      ? "lf-btn-primary"
                      : "lf-btn-outline"
                  }`}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "0.9375rem",
                  }}
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          );
        })}
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
