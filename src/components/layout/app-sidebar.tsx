"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarClock,
  DollarSign,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Bell,
  UserCircle,
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
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Case Management",
    items: [
      { label: "Cases", href: "/cases", icon: Briefcase },
      { label: "Clients", href: "/clients", icon: Users },
    ],
  },
  {
    label: "Calendar",
    items: [
      { label: "Deadlines", href: "/deadlines", icon: CalendarClock, badge: 2 },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Billing", href: "/billing", icon: DollarSign },
    ],
  },
  {
    label: "Intake",
    items: [
      { label: "Intake Forms", href: "/intake", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <aside
      className="flex h-screen w-64 flex-col flex-shrink-0"
      style={{ background: "var(--navy)", color: "var(--sidebar-foreground)" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--gold)" }}
        >
          <Scale className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <span
          className="text-lg font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          LawFlow
        </span>
      </div>

      {/* Notification banner */}
      <div className="mx-3 mt-4 mb-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
          style={{ background: "rgba(196,154,46,0.15)", color: "var(--gold-light)" }}
        >
          <Bell style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>2 deadlines approaching</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150"
                  style={{
                    background: isActive ? "rgba(196,154,46,0.15)" : "transparent",
                    color: isActive ? "var(--gold-light)" : "rgba(255,255,255,0.7)",
                    borderLeft: isActive ? "3px solid var(--gold)" : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: "var(--danger)", padding: "0 6px" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer links */}
      <div className="px-3 pb-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="pt-3 space-y-0.5">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              color: pathname === "/settings" ? "var(--gold-light)" : "rgba(255,255,255,0.6)",
              background: pathname === "/settings" ? "rgba(196,154,46,0.15)" : "transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = pathname === "/settings" ? "rgba(196,154,46,0.15)" : "transparent";
            }}
          >
            <Settings style={{ width: 18, height: 18 }} />
            Settings
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              color: pathname === "/help" ? "var(--gold-light)" : "rgba(255,255,255,0.6)",
              background: pathname === "/help" ? "rgba(196,154,46,0.15)" : "transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = pathname === "/help" ? "rgba(196,154,46,0.15)" : "transparent";
            }}
          >
            <HelpCircle style={{ width: 18, height: 18 }} />
            Help &amp; Support
          </Link>
        </div>
      </div>

      {/* User menu */}
      <div className="px-3 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative pt-3">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.85)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
              style={{ background: "var(--navy-muted)" }}
            >
              {session?.user?.name
                ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : "U"}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="truncate font-medium text-sm text-white">
                {session?.user?.name || "User"}
              </p>
              <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {session?.user?.email || ""}
              </p>
            </div>
            <ChevronDown
              style={{
                width: 16,
                height: 16,
                color: "rgba(255,255,255,0.4)",
                transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute bottom-full left-0 mb-1 w-full rounded-lg p-1 shadow-xl animate-fade-in"
              style={{
                background: "var(--navy-light)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                style={{ color: "#F87171" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut style={{ width: 16, height: 16 }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
