"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Briefcase,
  CalendarClock,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Abstract UI Mocks (CSS-only)
   ───────────────────────────────────────────── */

function MockCaseTable() {
  const rows = [
    { id: "CAS-2024-0042", name: "Williams v. Corp", status: "Active", color: "var(--success)" },
    { id: "CAS-2024-0038", name: "Estate of Johnson", status: "Discovery", color: "var(--info)" },
    { id: "CAS-2024-0035", name: "Chen IP Filing", status: "Review", color: "var(--warning)" },
    { id: "CAS-2024-0031", name: "Parker Contract", status: "Closed", color: "var(--text-muted)" },
  ];

  return (
    <MockCard>
      {/* Table header */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.2fr 1.8fr 1fr",
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {["Case #", "Name", "Status"].map((h) => (
          <div
            key={h}
            style={{
              fontSize: "0.6rem",
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
      {rows.map((r) => (
        <div
          key={r.id}
          className="grid"
          style={{
            gridTemplateColumns: "1.2fr 1.8fr 1fr",
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--border-light)",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontFamily: "monospace",
              color: "var(--text-muted)",
            }}
          >
            {r.id}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {r.name}
          </div>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.6rem",
              fontWeight: 600,
              padding: "0.125rem 0.5rem",
              borderRadius: 999,
              background: `${r.color}15`,
              color: r.color,
              fontFamily: "var(--font-body)",
              width: "fit-content",
            }}
          >
            {r.status}
          </span>
        </div>
      ))}
    </MockCard>
  );
}

function MockDeadlineCalendar() {
  const deadlines = [
    { date: "Mar 15", label: "Filing — Williams v. Corp", priority: "var(--danger)" },
    { date: "Mar 18", label: "Court hearing — Parker", priority: "var(--warning)" },
    { date: "Mar 22", label: "Discovery due — Johnson", priority: "var(--info)" },
    { date: "Apr 01", label: "IP filing deadline — Chen", priority: "var(--success)" },
  ];

  return (
    <MockCard>
      <div
        style={{
          padding: "0.5rem 0.75rem 0.25rem",
          fontSize: "0.65rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-body)",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "0.5rem",
        }}
      >
        Upcoming Deadlines
      </div>
      {deadlines.map((d) => (
        <div
          key={d.label}
          className="flex items-center gap-3"
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            style={{
              width: 4,
              height: 28,
              borderRadius: 2,
              background: d.priority,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                marginBottom: 1,
              }}
            >
              {d.label}
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {d.date}
            </div>
          </div>
        </div>
      ))}
    </MockCard>
  );
}

function MockInvoice() {
  return (
    <MockCard>
      <div
        className="flex items-center justify-between"
        style={{
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-body)",
          }}
        >
          Invoice #INV-2024-019
        </div>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 600,
            padding: "0.125rem 0.5rem",
            borderRadius: 999,
            background: "var(--success-bg)",
            color: "var(--success)",
            fontFamily: "var(--font-body)",
          }}
        >
          Paid
        </span>
      </div>
      {/* Line items */}
      {[
        { item: "Legal consultation (4 hrs)", amount: "$1,200.00" },
        { item: "Document review", amount: "$450.00" },
        { item: "Court filing fee", amount: "$75.00" },
      ].map((li) => (
        <div
          key={li.item}
          className="flex items-center justify-between"
          style={{
            padding: "0.4rem 0.75rem",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {li.item}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {li.amount}
          </div>
        </div>
      ))}
      {/* Total */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "0.625rem 0.75rem",
          background: "var(--bg-base)",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--navy)",
            fontFamily: "var(--font-body)",
          }}
        >
          Total
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
          }}
        >
          $1,725.00
        </div>
      </div>
    </MockCard>
  );
}

function MockClientDirectory() {
  const clients = [
    { name: "Williams LLC", type: "Business", cases: 3 },
    { name: "John Johnson", type: "Individual", cases: 1 },
    { name: "Chen Technologies", type: "Business", cases: 2 },
    { name: "Sarah Parker", type: "Individual", cases: 1 },
  ];

  return (
    <MockCard>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.5fr 1fr 0.5fr",
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {["Client", "Type", "Cases"].map((h) => (
          <div
            key={h}
            style={{
              fontSize: "0.6rem",
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
      {clients.map((c) => (
        <div
          key={c.name}
          className="grid"
          style={{
            gridTemplateColumns: "1.5fr 1fr 0.5fr",
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--border-light)",
            alignItems: "center",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: c.type === "Business" ? "rgba(15, 27, 51, 0.08)" : "rgba(196, 154, 46, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: c.type === "Business" ? "var(--navy)" : "var(--gold)",
                fontFamily: "var(--font-body)",
                flexShrink: 0,
              }}
            >
              {c.name.charAt(0)}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {c.name}
            </div>
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {c.type}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {c.cases}
          </span>
        </div>
      ))}
    </MockCard>
  );
}

function MockIntakeForm() {
  const intakes = [
    { name: "New Prospect — Alex Rivera", status: "Pending Review", color: "var(--warning)" },
    { name: "Jane Doe — Personal Injury", status: "Conflict Check", color: "var(--info)" },
    { name: "Metro Corp — Contract Dispute", status: "Approved", color: "var(--success)" },
  ];

  return (
    <MockCard>
      <div
        style={{
          padding: "0.5rem 0.75rem 0.25rem",
          fontSize: "0.65rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-body)",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "0.5rem",
        }}
      >
        Recent Intake Submissions
      </div>
      {intakes.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between"
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {item.name}
          </div>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 600,
              padding: "0.125rem 0.5rem",
              borderRadius: 999,
              background: `${item.color}15`,
              color: item.color,
              fontFamily: "var(--font-body)",
            }}
          >
            {item.status}
          </span>
        </div>
      ))}
      {/* Fake form fields */}
      <div style={{ padding: "0.625rem 0.75rem" }}>
        <div
          style={{
            height: 6,
            width: "60%",
            background: "var(--border-light)",
            borderRadius: 3,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            height: 6,
            width: "80%",
            background: "var(--border-light)",
            borderRadius: 3,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            height: 6,
            width: "45%",
            background: "var(--border-light)",
            borderRadius: 3,
          }}
        />
      </div>
    </MockCard>
  );
}

function MockCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature Section Data
   ───────────────────────────────────────────── */

const featureSections = [
  {
    title: "Case Management",
    subtitle: "Complete case lifecycle management",
    description:
      "Track every case from intake to resolution. LawFlow provides a centralized hub for all case-related information, ensuring nothing falls through the cracks as your practice grows.",
    bullets: [
      "Track case status from open to closed",
      "Associate clients, deadlines, and billing records",
      "Full-text search across all cases",
      "Auto-generated case numbers",
    ],
    icon: Briefcase,
    iconColor: "var(--navy)",
    iconBg: "rgba(15, 27, 51, 0.08)",
    mock: <MockCaseTable />,
  },
  {
    title: "Deadline & Calendar",
    subtitle: "Never miss a critical date",
    description:
      "Court dates, filing deadlines, and discovery windows are the lifeblood of legal practice. LawFlow keeps every critical date visible, prioritized, and linked to the right case.",
    bullets: [
      "Filing deadlines, court appearances, discovery dates",
      "Priority levels with visual indicators",
      "Linked to specific cases for context",
      "Dashboard alerts for upcoming deadlines",
    ],
    icon: CalendarClock,
    iconColor: "var(--danger)",
    iconBg: "var(--danger-bg)",
    mock: <MockDeadlineCalendar />,
  },
  {
    title: "Billing & Invoicing",
    subtitle: "Professional invoicing in minutes",
    description:
      "Create detailed, professional invoices with line-item precision. Track payment status across your entire client base and eliminate the billing bottleneck.",
    bullets: [
      "Hourly, flat fee, and contingency billing",
      "Line-item invoices with auto-calculation",
      "Payment tracking (paid, unpaid, overdue)",
      "Linked to cases and clients",
    ],
    icon: DollarSign,
    iconColor: "var(--success)",
    iconBg: "var(--success-bg)",
    mock: <MockInvoice />,
  },
  {
    title: "Client Management",
    subtitle: "Know your clients",
    description:
      "Maintain a comprehensive client directory that gives you instant access to contact details, case history, billing records, and private notes for every client relationship.",
    bullets: [
      "Complete client directory",
      "Individual and business entity support",
      "Case history and billing overview",
      "Secure notes and contact management",
    ],
    icon: Users,
    iconColor: "var(--info)",
    iconBg: "var(--info-bg)",
    mock: <MockClientDirectory />,
  },
  {
    title: "Client Intake",
    subtitle: "Streamlined onboarding",
    description:
      "Bring new clients on board efficiently with digital intake workflows. Run conflict checks, capture essential information, and convert prospects into active clients seamlessly.",
    bullets: [
      "Digital intake forms",
      "Conflict check support",
      "Convert prospects to active clients",
      "Track intake status from pending to completed",
    ],
    icon: FileText,
    iconColor: "var(--warning)",
    iconBg: "var(--warning-bg)",
    mock: <MockIntakeForm />,
  },
];

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function FeaturesPage() {
  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* ── Hero ─────────────────────────────── */}
      <section
        style={{
          background:
            "linear-gradient(170deg, var(--navy) 0%, var(--navy-light) 55%, #243355 100%)",
          paddingTop: 140,
          paddingBottom: 80,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent orb */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(196,154,46,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="mx-auto px-6 lg:px-8 text-center"
          style={{ maxWidth: 760, position: "relative", zIndex: 1 }}
        >
          <h1
            className="animate-fade-in-up"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "1.25rem",
            }}
          >
            Everything your firm needs,{" "}
            <span style={{ color: "var(--gold-light)" }}>in one place</span>
          </h1>
          <p
            className="animate-fade-in-up"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.175rem)",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1.7,
              animationDelay: "100ms",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            LawFlow combines case management, billing, deadlines, and client
            intake into a single platform designed exclusively for legal
            professionals.
          </p>
        </div>
      </section>

      {/* ── Feature Sections (alternating) ──── */}
      {featureSections.map((section, idx) => {
        const isReversed = idx % 2 !== 0;
        const Icon = section.icon;

        return (
          <section
            key={section.title}
            style={{
              paddingTop: 80,
              paddingBottom: 80,
              background: idx % 2 === 0 ? "var(--bg-base)" : "var(--bg-card)",
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <div
              className="mx-auto px-6 lg:px-8"
              style={{ maxWidth: 1200 }}
            >
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center`}
              >
                {/* Text side */}
                <div
                  className="animate-fade-in-up"
                  style={{
                    order: isReversed ? 2 : 1,
                    animationDelay: "100ms",
                  }}
                >
                  {/* Icon + subtitle */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-sm)",
                        background: section.iconBg,
                      }}
                    >
                      <Icon
                        style={{
                          width: 20,
                          height: 20,
                          color: section.iconColor,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: section.iconColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {section.title}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(1.375rem, 3vw, 2rem)",
                      fontWeight: 700,
                      color: "var(--navy)",
                      lineHeight: 1.25,
                      marginBottom: "1rem",
                    }}
                  >
                    {section.subtitle}
                  </h2>

                  <p
                    style={{
                      fontSize: "1rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.75,
                      marginBottom: "1.5rem",
                    }}
                  >
                    {section.description}
                  </p>

                  {/* Bullet points */}
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {section.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2.5"
                      >
                        <CheckCircle2
                          style={{
                            width: 18,
                            height: 18,
                            color: "var(--success)",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.9375rem",
                            color: "var(--text-primary)",
                            lineHeight: 1.6,
                          }}
                        >
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mock UI side */}
                <div
                  className="animate-fade-in-up"
                  style={{
                    order: isReversed ? 1 : 2,
                    animationDelay: "250ms",
                  }}
                >
                  {section.mock}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ── Bottom CTA ───────────────────────── */}
      <section
        style={{
          paddingTop: 80,
          paddingBottom: 80,
          background:
            "linear-gradient(170deg, var(--navy) 0%, var(--navy-light) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(196,154,46,0.1) 0%, transparent 70%)",
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
            Start managing your practice better today
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "rgba(255, 255, 255, 0.7)",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Join hundreds of law firms that have simplified their operations
            with LawFlow.
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
