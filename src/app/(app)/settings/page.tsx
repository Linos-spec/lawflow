"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useFirm } from "@/components/providers/firm-provider";
import { DeliveryConnectionCard } from "@/components/delivery/delivery-connection-card";
import { AuditLogViewer } from "@/components/settings/audit-log-viewer";
import { TeamRoles } from "@/components/settings/team-roles";
import { BillingPanel } from "@/components/settings/billing-panel";
import { TwoFactorCard } from "@/components/settings/two-factor";
import { DataAccountCard } from "@/components/settings/data-account";
import {
  User,
  Users,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Upload,
  Check,
  Bot,
  ScrollText,
  CalendarClock,
  ExternalLink,
} from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "firm", label: "Firm Details", icon: Building2 },
  { id: "ai", label: "AI Employee", icon: Bot },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "team", label: "Team & Roles", icon: Users },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
] as const;

const ADMIN_TABS = ["audit", "team"];

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
  const { firm, refresh } = useFirm();
  const isAdmin = session?.user?.role === "ADMIN";
  const [savingAi, setSavingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  async function patchFirm(body: Record<string, boolean>, msg: string) {
    if (!isAdmin || savingAi) return;
    setSavingAi(true);
    try {
      const res = await fetch("/api/v1/firm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { toast.error("Couldn't save AI settings"); return; }
      await refresh();
      toast.success(msg);
    } finally {
      setSavingAi(false);
    }
  }
  const toggleAiMode = () =>
    patchFirm({ aiModeEnabled: !firm?.aiModeEnabled }, !firm?.aiModeEnabled ? "AI Employee mode enabled for your firm" : "AI Employee mode disabled");

  // Calendly scheduling link (self-service client booking).
  const [calendly, setCalendly] = useState("");
  const [savingCal, setSavingCal] = useState(false);
  useEffect(() => { if (firm) setCalendly(firm.calendlyUrl || ""); }, [firm]);
  async function saveCalendly() {
    if (!isAdmin || savingCal) return;
    setSavingCal(true);
    try {
      const res = await fetch("/api/v1/firm", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendlyUrl: calendly.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json.error || "Couldn't save the scheduling link"); return; }
      await refresh();
      toast.success(calendly.trim() ? "Scheduling link saved" : "Scheduling link removed");
    } finally { setSavingCal(false); }
  }

  // Calendly account connection (auto-syncs booked events into the calendar).
  const [calToken, setCalToken] = useState("");
  const [connectingCal, setConnectingCal] = useState(false);
  async function connectCalendly() {
    if (!isAdmin || connectingCal || !calToken.trim()) return;
    setConnectingCal(true);
    try {
      const res = await fetch("/api/v1/firm/calendly-connection", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: calToken.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json.error || "Couldn't connect Calendly"); return; }
      setCalToken("");
      await refresh();
      toast.success(`Calendly connected${json.data?.name ? ` — ${json.data.name}` : ""}`);
    } finally { setConnectingCal(false); }
  }
  async function disconnectCalendly() {
    if (!isAdmin || connectingCal) return;
    setConnectingCal(true);
    try {
      const res = await fetch("/api/v1/firm/calendly-connection", { method: "DELETE" });
      if (!res.ok) { toast.error("Couldn't disconnect"); return; }
      await refresh();
      toast.success("Calendly disconnected");
    } finally { setConnectingCal(false); }
  }

  // Notification toggles
  const [notifs, setNotifs] = useState({
    deadlines: true,
    intake: true,
    invoicePaid: false,
    weeklyDigest: true,
  });

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
        {tabs.filter((tab) => !ADMIN_TABS.includes(tab.id) || isAdmin).map((tab) => {
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

            {/* Client scheduling (Calendly) — functional */}
            <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CalendarClock style={{ width: 16, height: 16, color: "var(--gold)" }} />
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>Client scheduling</h3>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: 12 }}>
                Add your Calendly link so clients can self-book from their portal, and so your team can send a booking link when the AI detects a meeting request in a client message. Calendly handles availability, time zones, reminders, and syncs to your real calendar.
              </p>
              <label className="lf-label">Calendly link</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="url"
                  className="lf-input"
                  style={{ flex: 1, minWidth: 240 }}
                  placeholder="https://calendly.com/your-firm/consultation"
                  value={calendly}
                  onChange={(e) => setCalendly(e.target.value)}
                  disabled={!isAdmin}
                />
                <button className="lf-btn lf-btn-gold" type="button" onClick={saveCalendly} disabled={!isAdmin || savingCal}>
                  <Check style={{ width: 16, height: 16 }} />
                  {savingCal ? "Saving…" : "Save link"}
                </button>
              </div>
              {firm?.calendlyUrl && (
                <a href={firm.calendlyUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>
                  <ExternalLink style={{ width: 13, height: 13 }} /> Preview your booking page
                </a>
              )}
              {!isAdmin && <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: 8 }}>Only an admin can change the scheduling link.</p>}

              {/* Two-way sync: connect the Calendly account so booked events appear on the calendar */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed var(--border-default)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.9rem" }}>Auto-sync booked meetings</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Connect your Calendly account and confirmed bookings appear on your matter calendar automatically — cancellations remove them.
                    </p>
                  </div>
                  {firm?.calendlyConnected && (
                    <span className="lf-badge lf-badge-green" style={{ whiteSpace: "nowrap" }}>
                      <Check style={{ width: 13, height: 13 }} /> Connected{firm.calendlyName ? ` · ${firm.calendlyName}` : ""}
                    </span>
                  )}
                </div>

                {firm?.calendlyConnected ? (
                  <button className="lf-btn lf-btn-outline" type="button" onClick={disconnectCalendly} disabled={!isAdmin || connectingCal} style={{ marginTop: 12 }}>
                    {connectingCal ? "Disconnecting…" : "Disconnect Calendly"}
                  </button>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <label className="lf-label">Calendly personal access token</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        type="password"
                        className="lf-input"
                        style={{ flex: 1, minWidth: 240 }}
                        placeholder="Paste your Calendly PAT"
                        value={calToken}
                        onChange={(e) => setCalToken(e.target.value)}
                        disabled={!isAdmin}
                        autoComplete="off"
                      />
                      <button className="lf-btn lf-btn-gold" type="button" onClick={connectCalendly} disabled={!isAdmin || connectingCal || !calToken.trim()}>
                        {connectingCal ? "Connecting…" : "Connect"}
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                      Create a token at{" "}
                      <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noreferrer" style={{ color: "var(--gold)", fontWeight: 600 }}>calendly.com → Integrations → API &amp; webhooks</a>.
                      We store it securely and use it only to register a booking webhook. You can disconnect anytime.
                    </p>
                  </div>
                )}
              </div>
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
            <TwoFactorCard />

            {/* Data export & account closure (admin) */}
            {isAdmin && <DataAccountCard />}
          </div>
        )}

        {/* ── Team & Roles (admin only) ── */}
        {activeTab === "team" && isAdmin && (
          <div className="max-w-3xl"><TeamRoles currentUserId={session?.user?.id} /></div>
        )}

        {/* ── Audit Log (admin only) ── */}
        {activeTab === "audit" && isAdmin && (
          <div className="max-w-4xl"><AuditLogViewer /></div>
        )}

        {/* ── Plan & Billing ── */}
        {activeTab === "billing" && <BillingPanel />}

        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="lf-card" style={{ padding: "1.75rem", maxWidth: 640 }}>
            <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot style={{ width: 22, height: 22, color: "#fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>AI Employee mode</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
                  Turn on the AI Employee workspace — an opt-in pipeline that runs intake, analysis, documents,
                  tasks, and billing, with an attorney review gate before anything leaves the firm. Practice mode
                  stays exactly as it is; each lawyer can switch between the two.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginTop: "1.5rem", padding: "1rem 1.15rem", borderRadius: 12, background: "var(--bg-base)", border: "1px solid var(--border-light)" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>Enable for this firm</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {firm?.aiModeEnabled ? "The AI Employee switch is available in the sidebar." : "Off — lawyers see Practice mode only."}
                </div>
              </div>
              {isAdmin ? (
                <Toggle active={!!firm?.aiModeEnabled} onToggle={toggleAiMode} />
              ) : (
                <span className="lf-badge lf-badge-gray">{firm?.aiModeEnabled ? "Enabled" : "Disabled"}</span>
              )}
            </div>

            {!isAdmin && (
              <p className="text-sm" style={{ color: "var(--text-muted)", marginTop: "0.9rem" }}>
                Only a firm admin can enable or disable AI Employee mode.
              </p>
            )}

            {firm?.aiModeEnabled && (
              <div style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-light)" }}>
                <h4 className="text-sm font-bold" style={{ color: "var(--navy)", marginBottom: "0.25rem" }}>Automation setup</h4>
                <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                  What the AI Employee does on its own. Conflicts always route to the attorney review queue, regardless of these settings.
                </p>

                {[
                  { key: "aiAutoCreateMatter" as const, title: "Auto-create matters", desc: "When a qualified lead is converted, open the case automatically with AI-filled details." },
                  { key: "aiAutoGenerateTasks" as const, title: "Auto-draft deadline plan", desc: "When a matter opens, draft a starter set of deadlines by matter type for the attorney to verify." },
                  { key: "aiAutoEngagementLetter" as const, title: "Auto-draft engagement letters", desc: "When a matter opens, draft a client engagement letter (with the recommended retainer terms) for the attorney to review and send." },
                ].map((opt) => (
                  <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.85rem 0", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ maxWidth: 420 }}>
                      <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{opt.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{opt.desc}</div>
                    </div>
                    {isAdmin ? (
                      <Toggle active={!!firm?.[opt.key]} onToggle={() => patchFirm({ [opt.key]: !firm?.[opt.key] }, "AI automation updated")} />
                    ) : (
                      <span className="lf-badge lf-badge-gray">{firm?.[opt.key] ? "On" : "Off"}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DeliveryConnectionCard isAdmin={isAdmin} />
          </div>
        )}
      </div>
    </div>
  );
}
