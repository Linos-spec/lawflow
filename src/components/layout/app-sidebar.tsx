"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarClock,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
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
      { label: "Deadlines", href: "/deadlines", icon: CalendarClock },
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
  {
    label: "Administration",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Scale className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">LawFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !("roles" in item) || !item.roles || item.roles.includes(userRole || "")
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="border-t p-3">
        <div className="group relative">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/50">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <p className="truncate font-medium text-sm">
                {session?.user?.name || "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email || ""}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="absolute bottom-full left-0 mb-1 hidden w-full rounded-md border bg-popover p-1 shadow-md group-focus-within:block">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
