"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Scale, Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { PRACTICE_AREAS, FIRM_SIZES, ROLES, type Segment } from "@/lib/solutions";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(false);
  const solTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSol = () => { if (solTimer.current) clearTimeout(solTimer.current); setSolOpen(true); };
  const closeSol = () => { solTimer.current = setTimeout(() => setSolOpen(false), 140); };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px) saturate(1.2)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px) saturate(1.2)" : "none",
        boxShadow: scrolled ? "0 1px 3px rgba(15, 27, 51, 0.08), 0 1px 2px rgba(15, 27, 51, 0.04)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-light)" : "1px solid transparent",
      }}
    >
      <nav
        className="mx-auto flex items-center justify-between px-6 lg:px-8"
        style={{
          maxWidth: 1200,
          height: 72,
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline"
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
              color: scrolled ? "var(--navy)" : "#fff",
              transition: "color 0.3s ease",
            }}
          >
            Linoscore Legal
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <button
            type="button"
            onMouseEnter={openSol}
            onMouseLeave={closeSol}
            onClick={() => setSolOpen((o) => !o)}
            className="text-sm font-medium transition-colors duration-200"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", color: scrolled ? "var(--text-secondary)" : "rgba(255,255,255,0.85)", letterSpacing: "0.01em" }}
          >
            Solutions <ChevronDown style={{ width: 14, height: 14, transform: solOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{
                fontFamily: "var(--font-body)",
                color: scrolled ? "var(--text-secondary)" : "rgba(255, 255, 255, 0.85)",
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = scrolled
                  ? "var(--navy)"
                  : "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = scrolled
                  ? "var(--text-secondary)"
                  : "rgba(255, 255, 255, 0.85)";
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="lf-btn lf-btn-outline"
            style={{
              background: scrolled ? "transparent" : "rgba(255, 255, 255, 0.1)",
              color: scrolled ? "var(--navy)" : "#fff",
              borderColor: scrolled ? "var(--border-default)" : "rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s ease",
              textDecoration: "none",
              fontSize: "0.8125rem",
              padding: "0.5rem 1.125rem",
            }}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="lf-btn lf-btn-gold"
            style={{
              textDecoration: "none",
              fontSize: "0.8125rem",
              padding: "0.5rem 1.25rem",
            }}
          >
            Request access
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-sm)",
            background: mobileOpen
              ? scrolled
                ? "var(--bg-base)"
                : "rgba(255, 255, 255, 0.15)"
              : "transparent",
            border: "none",
            cursor: "pointer",
            color: scrolled ? "var(--navy)" : "#fff",
            transition: "all 0.2s ease",
          }}
        >
          {mobileOpen ? (
            <X style={{ width: 22, height: 22 }} />
          ) : (
            <Menu style={{ width: 22, height: 22 }} />
          )}
        </button>
      </nav>

      {/* Desktop Solutions mega-menu */}
      {solOpen && (
        <div
          className="hidden md:block"
          onMouseEnter={openSol}
          onMouseLeave={closeSol}
          style={{ position: "absolute", top: 72, left: 0, right: 0, background: "#fff", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", boxShadow: "0 12px 30px rgba(15,27,51,0.12)" }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.75rem 2rem", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: "2rem" }}>
            <MegaCol title="By practice area" href="/solutions#practice-areas" items={PRACTICE_AREAS.slice(0, 8)} two onNavigate={() => setSolOpen(false)} />
            <MegaCol title="By firm size" href="/solutions#firm-size" items={FIRM_SIZES} onNavigate={() => setSolOpen(false)} />
            <MegaCol title="By role" href="/solutions#roles" items={ROLES} onNavigate={() => setSolOpen(false)} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-light)", background: "var(--bg-base)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>One shared client &amp; matter record — inquiry to invoice.</span>
              <Link href="/solutions" onClick={() => setSolOpen(false)} style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gold)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                See all solutions <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu panel */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: mobileOpen ? 380 : 0,
          opacity: mobileOpen ? 1 : 0,
          background: scrolled ? "rgba(255, 255, 255, 0.98)" : "rgba(15, 27, 51, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: mobileOpen
            ? scrolled
              ? "1px solid var(--border-light)"
              : "1px solid rgba(255, 255, 255, 0.1)"
            : "none",
        }}
      >
        <div className="px-6 py-5 flex flex-col gap-1">
          <Link
            href="/solutions"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-4 py-3 text-sm font-medium"
            style={{ color: scrolled ? "var(--text-primary)" : "rgba(255,255,255,0.9)", textDecoration: "none", fontFamily: "var(--font-body)" }}
          >
            Solutions
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-150"
              style={{
                color: scrolled ? "var(--text-primary)" : "rgba(255, 255, 255, 0.9)",
                textDecoration: "none",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = scrolled
                  ? "var(--bg-base)"
                  : "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div
            className="my-3"
            style={{
              height: 1,
              background: scrolled
                ? "var(--border-light)"
                : "rgba(255, 255, 255, 0.1)",
            }}
          />

          {/* Mobile CTA buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="lf-btn lf-btn-outline"
              style={{
                width: "100%",
                textDecoration: "none",
                justifyContent: "center",
                background: scrolled ? "transparent" : "rgba(255, 255, 255, 0.1)",
                color: scrolled ? "var(--navy)" : "#fff",
                borderColor: scrolled
                  ? "var(--border-default)"
                  : "rgba(255, 255, 255, 0.25)",
              }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="lf-btn lf-btn-gold"
              style={{
                width: "100%",
                textDecoration: "none",
                justifyContent: "center",
              }}
            >
              Request access
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function MegaCol({ title, href, items, two, onNavigate }: { title: string; href: string; items: Segment[]; two?: boolean; onNavigate: () => void }) {
  return (
    <div>
      <Link href={href} onClick={onNavigate} style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", textDecoration: "none" }}>{title}</Link>
      <div style={{ display: "grid", gridTemplateColumns: two ? "1fr 1fr" : "1fr", gap: "0.1rem 1.25rem", marginTop: "0.75rem" }}>
        {items.map((s) => (
          <Link key={s.slug} href={`/register?for=${s.slug}`} onClick={onNavigate}
            style={{ display: "block", padding: "0.3rem 0", fontSize: "0.9rem", color: "var(--navy)", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--navy)")}
          >{s.label}</Link>
        ))}
      </div>
    </div>
  );
}
