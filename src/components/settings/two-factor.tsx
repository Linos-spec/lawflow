"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Loader2, ShieldCheck, ShieldOff, Copy, Check, KeyRound } from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────── Enroll flow (QR → confirm → backup codes) ─────── */
export function TwoFactorEnroll({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"start" | "qr" | "codes">("start");
  const [qr, setQr] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setup" }) });
      const j = await res.json();
      if (!j.success) { toast.error(j.error || "Couldn't start setup"); return; }
      setQr({ qrDataUrl: j.data.qrDataUrl, secret: j.data.secret });
      setStep("qr");
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (code.replace(/\s/g, "").length < 6) { toast.error("Enter the 6-digit code"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enable", token: code }) });
      const j = await res.json();
      if (!res.ok || !j.success) { toast.error(j.error || "That code didn't match."); return; }
      setBackupCodes(j.data.backupCodes || []);
      setStep("codes");
      toast.success("Two-factor authentication is on");
    } finally { setBusy(false); }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (step === "start") {
    return (
      <button onClick={startSetup} disabled={busy} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 1rem" }}>
        {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <ShieldCheck style={{ width: 16, height: 16 }} />}
        Set up two-factor
      </button>
    );
  }

  if (step === "qr" && qr) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxWidth: 420 }}>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>1. Scan this with an authenticator app (Google Authenticator, 1Password, Authy).</p>
        <Image src={qr.qrDataUrl} alt="2FA QR code" width={180} height={180} style={{ borderRadius: 10, border: "1px solid var(--border-default)" }} unoptimized />
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Can&apos;t scan? Enter this key manually: <code style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--navy)" }}>{qr.secret}</code></p>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>2. Enter the 6-digit code it shows:</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456"
            style={{ width: 140, textAlign: "center", letterSpacing: "0.3em", fontSize: "1.1rem", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-base)", color: "var(--navy)" }} />
          <button onClick={confirm} disabled={busy} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem" }}>
            {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : "Verify & enable"}
          </button>
        </div>
      </div>
    );
  }

  // codes
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 420 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success)", fontWeight: 700 }}>
        <ShieldCheck style={{ width: 18, height: 18 }} /> Two-factor is on
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Save these <b>backup codes</b> somewhere safe. Each works once if you lose your authenticator. We won&apos;t show them again.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", background: "var(--bg-base)", padding: "0.75rem", borderRadius: 10, fontFamily: "var(--font-mono, monospace)", fontSize: "0.9rem", color: "var(--navy)" }}>
        {backupCodes.map((c) => <span key={c}>{c}</span>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={copyCodes} className="lf-btn lf-btn-outline" style={{ padding: "0.45rem 0.8rem" }}>
          {copied ? <Check style={{ width: 15, height: 15 }} /> : <Copy style={{ width: 15, height: 15 }} />} {copied ? "Copied" : "Copy codes"}
        </button>
        <button onClick={onDone} className="lf-btn lf-btn-gold" style={{ padding: "0.45rem 0.8rem" }}>Done</button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Settings card ─────────────────────────────────── */
export function TwoFactorCard() {
  const [status, setStatus] = useState<{ mfaEnabled: boolean; backupCodesRemaining: number; firmRequired: boolean; isAdmin: boolean } | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/auth/mfa");
    const j = await res.json();
    if (j.success) setStatus(j.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const disable = async () => {
    if (disableCode.replace(/\s/g, "").length < 6) { toast.error("Enter a current 2FA code"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disable", token: disableCode }) });
      const j = await res.json();
      if (!res.ok || !j.success) { toast.error(j.error || "Couldn't disable"); return; }
      setDisableCode(""); toast.success("Two-factor turned off"); await load();
    } finally { setBusy(false); }
  };

  const toggleRequire = async (required: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/firm/mfa-required", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ required }) });
      const j = await res.json();
      if (!res.ok || !j.success) { toast.error(j.error || "Couldn't update"); return; }
      toast.success(required ? "MFA is now required for all firm users" : "MFA requirement removed"); await load();
    } finally { setBusy(false); }
  };

  if (!status) return null;

  return (
    <div className="lf-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.35rem" }}>
        <KeyRound style={{ width: 18, height: 18, color: "var(--navy)" }} />
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>Two-factor authentication</h2>
        {status.mfaEnabled
          ? <span className="lf-badge lf-badge-green"><ShieldCheck style={{ width: 13, height: 13 }} /> On</span>
          : <span className="lf-badge lf-badge-gray">Off</span>}
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Add a one-time code from an authenticator app to your sign-in. Strongly recommended for firms handling privileged client data.
      </p>

      {!status.mfaEnabled ? (
        enrolling
          ? <TwoFactorEnroll onDone={() => { setEnrolling(false); load(); }} />
          : <button onClick={() => setEnrolling(true)} className="lf-btn lf-btn-gold" style={{ padding: "0.55rem 1rem" }}><ShieldCheck style={{ width: 16, height: 16 }} /> Enable two-factor</button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{status.backupCodesRemaining} backup code{status.backupCodesRemaining === 1 ? "" : "s"} remaining.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\s/g, "").slice(0, 10))} inputMode="numeric" placeholder="Current code to turn off"
              style={{ width: 210, padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-base)", color: "var(--navy)", fontSize: "0.9rem" }} />
            <button onClick={disable} disabled={busy} className="lf-btn lf-btn-ghost" style={{ padding: "0.45rem 0.7rem", color: "var(--danger)" }}>
              <ShieldOff style={{ width: 15, height: 15 }} /> Turn off
            </button>
          </div>
        </div>
      )}

      {status.isAdmin && (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-default)", cursor: "pointer" }}>
          <input type="checkbox" checked={status.firmRequired} disabled={busy} onChange={(e) => toggleRequire(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--gold)" }} />
          <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            <b style={{ color: "var(--navy)" }}>Require two-factor for all firm users.</b> Anyone without it will be prompted to set it up before they can continue.
          </span>
        </label>
      )}
    </div>
  );
}
