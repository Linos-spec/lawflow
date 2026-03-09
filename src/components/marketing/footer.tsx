"use client";

import Link from "next/link";
import { Scale, Mail } from "lucide-react";

const productLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "var(--navy)",
        color: "rgba(255, 255, 255, 0.7)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Top border accent */}
      <div
        style={{
          height: 3,
          background: "linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))",
        }}
      />

      <div
        className="mx-auto px-6 lg:px-8"
        style={{ maxWidth: 1200 }}
      >
        {/* Main grid */}
        <div
          className="grid gap-10 py-14 md:py-16"
          style={{
            gridTemplateColumns: "1fr",
          }}
        >
          <div
            className="grid gap-10"
            style={{
              gridTemplateColumns: "repeat(1, 1fr)",
            }}
          >
            {/* Desktop layout: use CSS grid media query via responsive classes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* Brand column */}
              <div className="md:col-span-1">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 mb-5"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 36,
                      height: 36,
                      background: "var(--gold)",
                    }}
                  >
                    <Scale style={{ width: 20, height: 20, color: "#fff" }} />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    LawFlow
                  </span>
                </Link>

                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{
                    color: "rgba(255, 255, 255, 0.55)",
                    maxWidth: 280,
                    lineHeight: 1.7,
                  }}
                >
                  Modern practice management for forward-thinking law firms.
                </p>

                <p
                  className="text-xs"
                  style={{ color: "rgba(255, 255, 255, 0.35)" }}
                >
                  &copy; {currentYear} LawFlow. All rights reserved.
                </p>
              </div>

              {/* Product links */}
              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Product
                </h4>
                <ul className="space-y-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {productLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors duration-200"
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                        }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal links */}
              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Legal
                </h4>
                <ul className="space-y-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {legalLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors duration-200"
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                        }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact column */}
              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Contact
                </h4>
                <div className="space-y-4">
                  <a
                    href="mailto:support@lawflow.app"
                    className="flex items-center gap-2.5 text-sm transition-colors duration-200"
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                    }}
                  >
                    <Mail style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} />
                    support@lawflow.app
                  </a>

                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: "rgba(255, 255, 255, 0.4)",
                      lineHeight: 1.7,
                    }}
                  >
                    Built for lawyers, by legal technologists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 text-xs"
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.3)",
          }}
        >
          <span>Designed with care for the legal profession.</span>
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "var(--success)",
              }}
            />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
