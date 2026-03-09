"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Upload,
  Check,
} from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "firm", label: "Firm Details", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`lf-toggle ${active ? "active" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
    />
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Notification toggles
  const [notifs, setNotifs] = useState({
    deadlines: true,
    intake: true,
    invoicePaid: false,
    weeklyDigest: true,
  });

  // 2FA toggle
  const [twoFA, setTwoFA] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Settings
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your account and firm preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="lf-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`lf-tab ${activeTab === tab.id ? "lf-tab-active" : ""}`}
            >
              <span className="flex items-center gap-2">
                <Icon style={{ width: 15, height: 15 }} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {/* ── Profile ── */}
        {activeTab === "profile" && (
          <div className="lf-card max-w-2xl space-y-6">
            {/* Photo upload */}
            <div className="flex items-center gap-5">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white flex-shrink-0"
                style={{ background: "var(--navy)" }}
              >
                {session?.user?.name
                  ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "U"}
              </div>
              <div>
                <button className="lf-btn lf-btn-outline" type="button">
                  <Upload style={{ width: 14, height: 14 }} />
                  Upload Photo
                </button>
                <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  JPG or PNG, max 2 MB
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="lf-label">Full Name</label>
                <input
                  type="text"
                  className="lf-input"
                  defaultValue={session?.user?.name || ""}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="lf-label">Email Address</label>
                <input
                  type="email"
                  className="lf-input"
                  defaultValue={session?.user?.email || ""}
                  placeholder="you@firm.com"
                />
              </div>
              <div>
                <label className="lf-label">Phone Number</label>
                <input
                  type="tel"
                  className="lf-input"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="lf-label">Bar Number</label>
                <input
                  type="text"
                  className="lf-input"
                  placeholder="e.g. 12345678"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="lf-btn lf-btn-gold" type="button">
                <Check style={{ width: 16, height: 16 }} />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── Firm Details ── */}
        {activeTab === "firm" && (
          <div className="lf-card max-w-2xl space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="lf-label">Firm Name</label>
                <input type="text" className="lf-input" placeholder="e.g. Mitchell & Associates" />
              </div>
              <div>
                <label className="lf-label">Primary Address</label>
                <input type="text" className="lf-input" placeholder="123 Legal Ave, Suite 400" />
              </div>
              <div>
                <label className="lf-label">City, State, ZIP</label>
                <input type="text" className="lf-input" placeholder="New York, NY 10001" />
              </div>
              <div>
                <label className="lf-label">Firm Phone</label>
                <input type="tel" className="lf-input" placeholder="(555) 000-0000" />
              </div>
              <div>
                <label className="lf-label">Firm Website</label>
                <input type="url" className="lf-input" placeholder="https://yourfirm.com" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button className="lf-btn lf-btn-gold" type="button">
                <Check style={{ width: 16, height: 16 }} />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        {activeTab === "notifications" && (
          <div className="lf-card max-w-2xl">
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Choose which notifications you&apos;d like to receive.
            </p>
            <div className="space-y-5">
              {[
                {
                  key: "deadlines" as const,
                  title: "Deadline Reminders",
                  desc: "Get notified 24 hours before a deadline is due",
                },
                {
                  key: "intake" as const,
                  title: "Intake Form Alerts",
                  desc: "Receive alerts when new intake forms are submitted",
                },
                {
                  key: "invoicePaid" as const,
                  title: "Invoice Paid",
                  desc: "Get notified when a client pays an invoice",
                },
                {
                  key: "weeklyDigest" as const,
                  title: "Weekly Digest",
                  desc: "Summary of your cases, deadlines, and revenue every Monday",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                      {item.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {item.desc}
                    </p>
                  </div>
                  <Toggle
                    active={notifs[item.key]}
                    onToggle={() => setNotifs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Security ── */}
        {activeTab === "security" && (
          <div className="space-y-6 max-w-2xl">
            {/* Password change */}
            <div className="lf-card space-y-4">
              <h3
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
              >
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="lf-label">Current Password</label>
                  <input type="password" className="lf-input" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="lf-label">New Password</label>
                  <input type="password" className="lf-input" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="lf-label">Confirm New Password</label>
                  <input type="password" className="lf-input" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button className="lf-btn lf-btn-primary" type="button">
                  Update Password
                </button>
              </div>
            </div>

            {/* 2FA */}
            <div className="lf-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-base font-bold"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                  >
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Toggle active={twoFA} onToggle={() => setTwoFA(!twoFA)} />
              </div>
              {twoFA && (
                <div
                  className="mt-4 rounded-lg p-3 text-sm"
                  style={{ background: "var(--success-bg)", color: "var(--success)" }}
                >
                  Two-factor authentication is enabled. You&apos;ll be prompted for a code on each sign-in.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Plan & Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-6 max-w-3xl">
            {/* Current plan */}
            <div
              className="lf-card flex items-center justify-between"
              style={{ borderLeft: "4px solid var(--gold)" }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Current Plan
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                >
                  Professional
                </p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  $49/month &middot; Up to 5 team members &middot; Unlimited cases
                </p>
              </div>
              <button className="lf-btn lf-btn-outline" type="button">
                Upgrade Plan
              </button>
            </div>

            {/* Invoice history */}
            <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <h3
                  className="text-base font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
                >
                  Invoice History
                </h3>
              </div>
              <table className="lf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: "Mar 1, 2026", desc: "Professional Plan — March", amount: "$49.00", status: "Paid" },
                    { date: "Feb 1, 2026", desc: "Professional Plan — February", amount: "$49.00", status: "Paid" },
                    { date: "Jan 1, 2026", desc: "Professional Plan — January", amount: "$49.00", status: "Paid" },
                  ].map((inv, i) => (
                    <tr key={i}>
                      <td className="text-sm">{inv.date}</td>
                      <td className="text-sm">{inv.desc}</td>
                      <td className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                        {inv.amount}
                      </td>
                      <td>
                        <span className="lf-badge lf-badge-green">{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
