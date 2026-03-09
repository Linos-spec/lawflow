"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  Users,
  DollarSign,
  FileText,
  Shield,
  Star,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */

const firmBadges = [
  "Davis & Partners",
  "Morrison Legal",
  "Sterling Law Group",
  "Apex Attorneys",
  "Caldwell & Associates",
];

const features = [
  {
    icon: Briefcase,
    title: "Case Management",
    desc: "Track every case from intake to resolution with status tracking, notes, and deadline management.",
    color: "var(--navy)",
    bg: "rgba(15, 27, 51, 0.08)",
  },
  {
    icon: CalendarClock,
    title: "Deadline Tracking",
    desc: "Never miss a filing date. Automated deadline alerts keep you ahead of every court date and statute.",
    color: "var(--danger)",
    bg: "var(--danger-bg)",
  },
  {
    icon: Users,
    title: "Client Management",
    desc: "Maintain a complete client directory with contact history, case associations, and secure notes.",
    color: "var(--info)",
    bg: "var(--info-bg)",
  },
  {
    icon: DollarSign,
    title: "Billing & Invoicing",
    desc: "Create invoices, track payments, and manage billing records with line-item detail.",
    color: "var(--success)",
    bg: "var(--success-bg)",
  },
  {
    icon: FileText,
    title: "Client Intake",
    desc: "Streamline new client onboarding with digital intake forms and conflict checks.",
    color: "var(--warning)",
    bg: "var(--warning-bg)",
  },
  {
    icon: Shield,
    title: "Team Collaboration",
    desc: "Role-based access control for admins, partners, associates, and paralegals.",
    color: "#7C3AED",
    bg: "rgba(124, 58, 237, 0.08)",
  },
];

const steps = [
  {
    num: 1,
    title: "Sign up in 60 seconds",
    desc: "Create your firm account and invite your team.",
  },
  {
    num: 2,
    title: "Set up your practice",
    desc: "Add clients, create cases, and configure your billing preferences.",
  },
  {
    num: 3,
    title: "Start practicing smarter",
    desc: "Manage deadlines, generate invoices, and grow your practice with confidence.",
  },
];

const testimonials = [
  {
    quote:
      "LawFlow cut our administrative time by 40%. The deadline tracking alone is worth the subscription.",
    name: "Sarah M.",
    title: "Managing Partner",
  },
  {
    quote:
      "Finally, a practice management tool that doesn't require a PhD to operate. Clean, intuitive, powerful.",
    name: "David R.",
    title: "Solo Practitioner",
  },
  {
    quote:
      "We migrated from spreadsheets to LawFlow in a weekend. Our team hasn't looked back.",
    name: "Jennifer L.",
    title: "Associate",
  },
];

/* ─────────────────────────────────────────────
   Mock Dashboard (CSS-only)
   ───────────────────────────────────────────── */

function MockDashboard() {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
        border: "1px solid var(--border-light)",
        padding: "1.5rem",
        maxWidth: 820,
        margin: "0 auto",
        animationDelay: "400ms",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#EF4444",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#F59E0B",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#22C55E",
          }}
        />
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: 120,
            height: 8,
            borderRadius: 4,
            background: "var(--border-light)",
          }}
        />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active Cases", value: "24", color: "var(--navy)" },
          { label: "This Week", value: "7", color: "var(--gold)" },
          { label: "Pending", value: "3", color: "var(--warning)" },
          { label: "Revenue", value: "$12.4k", color: "var(--success)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-base)",
              borderRadius: "var(--radius-sm)",
              padding: "0.875rem 1rem",
              borderLeft: `3px solid ${stat.color}`,
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--navy)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div
        style={{
          background: "var(--bg-base)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "0.625rem 1rem",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          {["Case", "Client", "Status", "Due"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body)",
              }}
            >
              {h}
            </div>
          ))}
        </div>
        {/* Rows */}
        {[
          {
            case_: "Williams v. Corp",
            client: "Williams LLC",
            status: "Active",
            statusColor: "var(--success)",
            due: "Mar 15",
          },
          {
            case_: "Estate of Johnson",
            client: "J. Johnson",
            status: "Discovery",
            statusColor: "var(--info)",
            due: "Mar 22",
          },
          {
            case_: "Chen IP Filing",
            client: "Chen Tech",
            status: "Review",
            statusColor: "var(--warning)",
            due: "Apr 1",
          },
        ].map((row) => (
          <div
            key={row.case_}
            className="grid"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              padding: "0.625rem 1rem",
              borderBottom: "1px solid var(--border-light)",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {row.case_}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {row.client}
            </div>
            <div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  padding: "0.125rem 0.5rem",
                  borderRadius: 999,
                  background: `${row.statusColor}15`,
                  color: row.statusColor,
                  fontFamily: "var(--font-body)",
                }}
              >
                {row.status}
              </span>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {row.due}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* ── Hero ─────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(170deg, var(--navy) 0%, var(--navy-light) 55%, #243355 100%)",
          paddingTop: 140,
          paddingBottom: 80,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,154,46,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,154,46,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="mx-auto px-6 lg:px-8"
          style={{ maxWidth: 1200, position: "relative", zIndex: 1 }}
        >
          <div className="text-center" style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1
              className="animate-fade-in-up"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: "1.25rem",
              }}
            >
              Legal Practice Management,{" "}
              <span style={{ color: "var(--gold-light)" }}>Simplified</span>
            </h1>

            <p
              className="animate-fade-in-up"
              style={{
                fontSize: "clamp(1rem, 2vw, 1.175rem)",
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.7,
                marginBottom: "2rem",
                animationDelay: "100ms",
              }}
            >
              LawFlow gives your firm the tools to manage cases, deadlines,
              billing, and clients — all in one powerful platform built for
              modern law practices.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <Link
                href="/register"
                className="lf-btn lf-btn-gold"
                style={{
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  padding: "0.75rem 1.75rem",
                }}
              >
                Start Free Trial
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/pricing"
                className="lf-btn lf-btn-outline"
                style={{
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  padding: "0.75rem 1.75rem",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  borderColor: "rgba(255, 255, 255, 0.25)",
                }}
              >
                See Pricing
              </Link>
            </div>
          </div>

          {/* Mock dashboard */}
          <div style={{ marginTop: 60 }}>
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* ── Trusted By ───────────────────────── */}
      <section
        style={{
          paddingTop: 48,
          paddingBottom: 48,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          className="mx-auto px-6 lg:px-8 text-center"
          style={{ maxWidth: 1200 }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "1.25rem",
            }}
          >
            Trusted by 500+ law firms across the country
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {firmBadges.map((name) => (
              <span
                key={name}
                style={{
                  display: "inline-block",
                  padding: "0.375rem 1rem",
                  borderRadius: 999,
                  background: "#F3F4F6",
                  color: "var(--text-secondary)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  fontFamily: "var(--font-body)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────── */}
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div
          className="mx-auto px-6 lg:px-8"
          style={{ maxWidth: 1200 }}
        >
          <div className="text-center" style={{ maxWidth: 600, margin: "0 auto 3rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--navy)",
                marginBottom: "0.75rem",
              }}
            >
              Everything you need to run your practice
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              Six powerful modules, one seamless platform. Built exclusively for
              legal professionals.
            </p>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="lf-card lf-card-interactive animate-fade-in-up"
                  style={{ padding: "1.75rem" }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-sm)",
                      background: f.bg,
                      marginBottom: "1rem",
                    }}
                  >
                    <Icon style={{ width: 22, height: 22, color: f.color }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.0625rem",
                      fontWeight: 700,
                      color: "var(--navy)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.7,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────── */}
      <section
        style={{
          paddingTop: 80,
          paddingBottom: 80,
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border-light)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          className="mx-auto px-6 lg:px-8"
          style={{ maxWidth: 1200 }}
        >
          <div className="text-center" style={{ maxWidth: 540, margin: "0 auto 3rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--navy)",
                marginBottom: "0.75rem",
              }}
            >
              Up and running in minutes
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              Three simple steps to transform how your firm operates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {steps.map((step) => (
              <div
                key={step.num}
                className="text-center animate-fade-in-up"
                style={{ padding: "0 0.5rem" }}
              >
                {/* Step number badge */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    color: "#fff",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    margin: "0 auto 1.25rem",
                    boxShadow: "0 4px 12px rgba(196, 154, 46, 0.3)",
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--navy)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    maxWidth: 300,
                    margin: "0 auto",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────── */}
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div
          className="mx-auto px-6 lg:px-8"
          style={{ maxWidth: 1200 }}
        >
          <div className="text-center" style={{ maxWidth: 540, margin: "0 auto 3rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--navy)",
                marginBottom: "0.75rem",
              }}
            >
              Loved by legal professionals
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              See why hundreds of law firms trust LawFlow every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="lf-card animate-fade-in-up"
                style={{
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        fill: "var(--gold)",
                        color: "var(--gold)",
                      }}
                    />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.75,
                    fontStyle: "italic",
                    marginBottom: "1.5rem",
                    flex: 1,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────── */}
      <section
        style={{
          paddingTop: 80,
          paddingBottom: 80,
          background: "linear-gradient(170deg, var(--navy) 0%, var(--navy-light) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent orb */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,154,46,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="mx-auto px-6 lg:px-8 text-center"
          style={{ maxWidth: 680, position: "relative", zIndex: 1 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.25,
              marginBottom: "1rem",
            }}
          >
            Ready to transform your practice?
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "rgba(255, 255, 255, 0.7)",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Join 500+ law firms already using LawFlow to save time and grow
            revenue.
          </p>
          <Link
            href="/register"
            className="lf-btn lf-btn-gold"
            style={{
              textDecoration: "none",
              fontSize: "1rem",
              padding: "0.875rem 2rem",
            }}
          >
            Start Free Trial
            <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </section>
    </div>
  );
}
