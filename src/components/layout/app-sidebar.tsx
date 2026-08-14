"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useFirm } from "@/components/providers/firm-provider";
import { track } from "@/lib/analytics";
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarClock,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Bell,
  Sparkles,
  UserPlus,
  FolderOpen,
  Truck,
  Bot,
  KanbanSquare,
  ClipboardCheck,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Case Management",
    items: [
      { label: "Cases", href: "/cases", icon: Briefcase },
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Documents", href: "/documents", icon: FolderOpen },
      { label: "Delivery", href: "/deliveries", icon: Truck },
    ],
  },
  { label: "Calendar", items: [{ label: "Deadlines", href: "/deadlines", icon: CalendarClock }] },
  { label: "Finance", items: [{ label: "Billing", href: "/billing", icon: DollarSign }] },
  {
    label: "Intake",
    items: [
      { label: "Leads", href: "/leads", icon: UserPlus },
      { label: "AI Intake", href: "/ai-intake", icon: ClipboardCheck },
    ],
  },
  { label: "AI Tools", items: [{ label: "AI Assistant", href: "/ai", icon: Sparkles }] },
];

const aiNavGroups: NavGroup[] = [
  {
    label: "AI Employee",
    items: [
      { label: "Pipeline Board", href: "/ai-employee", icon: KanbanSquare },
      { label: "Review Queue", href: "/ai-employee/review", icon: ClipboardCheck },
    ],
  },
  { label: "AI Tools", items: [{ label: "AI Assistant", href: "/ai", icon: Sparkles }] },
];

const COLLAPSE_KEY = "lf-sidebar-collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { firm } = useFirm();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deadlineAlerts, setDeadlineAlerts] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Restore the persisted collapse preference (after mount → no hydration skew).
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  // Collapse is a desktop-only affordance — the mobile drawer always shows
  // full labels regardless of the saved preference.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => { setIsDesktop(mq.matches); if (mq.matches) setMobileOpen(false); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      track("sidebar_collapsed", { collapsed: next });
      return next;
    });
  }, []);

  // Close the mobile drawer / user menu on route change.
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  // Escape closes whatever's open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMobileOpen(false); setUserMenuOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll behind the open mobile drawer.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/deadlines?limit=100")
      .then((r) => r.json())
      .then((j) => {
        if (!active || !j?.success) return;
        const soon = Date.now() + 14 * 86_400_000;
        const n = (j.data as { status: string; dueDate: string }[]).filter((d) =>
          d.status === "OVERDUE" || (d.status === "PENDING" && +new Date(d.dueDate) <= soon)
        ).length;
        setDeadlineAlerts(n);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  const aiEnabled = !!firm?.aiModeEnabled;
  const inAiMode = aiEnabled && pathname.startsWith("/ai-employee");
  const groups = inAiMode ? aiNavGroups : navGroups;
  // Visual compact state = collapsed preference, but only on desktop.
  const compact = collapsed && isDesktop;
  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      {/* Mobile top bar (hidden ≥ md via CSS) */}
      <div className="lf-mobile-topbar">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lf-icon-btn"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
        >
          <Menu style={{ width: 22, height: 22 }} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gold)" }}>
            <Scale style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <span className="font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>Linos Legal</span>
        </div>
        <span style={{ width: 40 }} aria-hidden />
      </div>

      {/* Backdrop scrim for the mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          className="lf-scrim md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`lf-sidebar ${compact ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`}
        aria-label="Primary"
      >
        {/* Logo + collapse toggle */}
        <div className="lf-sidebar-head">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" aria-label="Linos Legal — Dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ background: "var(--gold)" }}>
              <Scale style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            {!compact && (
              <span className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-heading)" }}>Linos Legal</span>
            )}
          </Link>
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="lf-icon-btn-dark lf-hide-mobile"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft style={{ width: 18, height: 18 }} /> : <PanelLeftClose style={{ width: 18, height: 18 }} />}
          </button>
          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lf-icon-btn-dark lf-hide-desktop"
            aria-label="Close navigation menu"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Workspace switcher */}
        {aiEnabled && !compact && (
          <div className="mx-3 mt-3" style={{ display: "flex", gap: 3, padding: 3, borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
            {[
              { key: "practice", label: "Practice", icon: Briefcase, active: !inAiMode, href: "/dashboard" },
              { key: "ai", label: "AI Employee", icon: Bot, active: inAiMode, href: "/ai-employee" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => router.push(m.href)}
                className="flex-1 lf-ws-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "0.4rem 0.5rem", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: "0.78rem", fontWeight: 600,
                  background: m.active ? "var(--gold)" : "transparent",
                  color: m.active ? "#fff" : "rgba(255,255,255,0.65)",
                }}
              >
                <m.icon style={{ width: 14, height: 14 }} /> {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Deadline banner */}
        {deadlineAlerts > 0 && !compact && (
          <div className="mx-3 mt-4 mb-1">
            <button
              onClick={() => router.push("/deadlines")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium lf-nav-focus"
              style={{ background: "rgba(245,158,11,0.15)", color: "var(--gold-light)", border: "none", cursor: "pointer" }}
            >
              <Bell style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>{deadlineAlerts} deadline{deadlineAlerts === 1 ? "" : "s"} approaching</span>
            </button>
          </div>
        )}

        {/* Navigation — independently scrollable */}
        <nav className="lf-sidebar-nav" aria-label="Main navigation">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              {!compact && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badge = item.href === "/deadlines" ? deadlineAlerts : item.badge;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`lf-nav-link ${active ? "is-active" : ""} ${compact ? "is-collapsed" : ""}`}
                    aria-current={active ? "page" : undefined}
                    aria-label={compact ? item.label : undefined}
                    title={compact ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="lf-nav-icon" style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden />
                    {!compact && <span className="flex-1 truncate">{item.label}</span>}
                    {badge ? (
                      <span
                        className={compact ? "lf-nav-dot" : "lf-nav-badge"}
                        aria-label={compact ? `${badge} alerts` : undefined}
                      >
                        {compact ? "" : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: settings + help */}
        <div className="lf-sidebar-foot">
          {[
            { href: "/settings", label: "Settings", icon: Settings },
            { href: "/help", label: "Help & Support", icon: HelpCircle },
          ].map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`lf-nav-link ${active ? "is-active" : ""} ${compact ? "is-collapsed" : ""}`}
                aria-current={active ? "page" : undefined}
                    aria-label={compact ? item.label : undefined}
                    title={compact ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="lf-nav-icon" style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden />
                {!compact && <span className="flex-1 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User menu (pinned) */}
        <div className="lf-sidebar-user">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="lf-user-btn"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="Account menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--navy-muted)" }}>
                {userInitials}
              </div>
              {!compact && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="truncate font-medium text-sm text-white">{session?.user?.name || "User"}</p>
                    <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{session?.user?.email || ""}</p>
                  </div>
                  <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.4)", transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-0 mb-1 w-full rounded-lg p-1 shadow-xl animate-fade-in"
                style={{ background: "var(--navy-light)", border: "1px solid rgba(255,255,255,0.1)", minWidth: 180 }}
              >
                <button
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm lf-nav-focus"
                  style={{ color: "#F87171", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <LogOut style={{ width: 16, height: 16 }} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
