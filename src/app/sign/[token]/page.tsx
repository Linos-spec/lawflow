"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldCheck, CheckCircle2, FileText, PenLine } from "lucide-react";

interface SignInfo {
  status: string;
  signerName: string;
  documentTitle: string;
  firmName: string;
  signedAt: string | null;
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<SignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [typedName, setTypedName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [justSigned, setJustSigned] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/sign/${token}`);
      const json = await res.json();
      if (json.success) { setInfo(json.data); setTypedName(json.data.signerName || ""); }
    } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const sign = async () => {
    setError("");
    if (!typedName.trim() || !consent) { setError("Type your full name and check the consent box."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/sign/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData: typedName.trim(), consent: true }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Could not sign"); return; }
      setJustSigned(true);
    } finally { setSubmitting(false); }
  };

  const wrap: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.25rem" };
  const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, padding: "2rem", boxShadow: "var(--shadow-lg)" };

  if (loading) return <div style={{ ...wrap, textAlign: "center", paddingTop: "6rem" }}><Loader2 style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: "var(--brand)" }} /></div>;
  if (!info) return <div style={wrap}><div style={card}>This signing link is not valid.</div></div>;

  const done = justSigned || info.status === "SIGNED";
  const unavailable = info.status === "EXPIRED" || info.status === "VOID" || info.status === "DECLINED";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={wrap}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.25rem", color: "var(--navy)" }}>{info.firmName}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Secure document signing · powered by Linoscore Legal</div>
        </div>

        <div style={card}>
          {done ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: "var(--success)", margin: "0 auto 0.75rem" }} />
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)" }}>Signed — thank you</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Your signature for <b>{info.documentTitle}</b> has been recorded and sent to {info.firmName}.</p>
            </div>
          ) : unavailable ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)" }}>This link is no longer active</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Please contact {info.firmName} for a new signing link.</p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)" }}>Please review and sign</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.35rem", marginBottom: "1.25rem" }}>{info.firmName} has asked you to sign <b>{info.documentTitle}</b>.</p>

              {/* Document viewer */}
              <div style={{ border: "1px solid var(--border-default)", borderRadius: 10, overflow: "hidden", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.9rem", background: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)" }}><FileText style={{ width: 15, height: 15 }} /> {info.documentTitle}</span>
                  <a href={`/api/public/sign/${token}/document`} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "var(--brand)" }}>Open full document ↗</a>
                </div>
                <iframe src={`/api/public/sign/${token}/document`} title="Document" style={{ width: "100%", height: 360, border: "none", background: "#fff" }} />
              </div>

              {/* Signature */}
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)", display: "block", marginBottom: "0.35rem" }}>Type your full legal name to sign</label>
              <div style={{ position: "relative" }}>
                <PenLine style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-muted)" }} />
                <input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Full name"
                  style={{ width: "100%", padding: "0.7rem 0.7rem 0.7rem 2.2rem", borderRadius: 10, border: "1px solid var(--border-default)", fontSize: "1.1rem", fontFamily: "'Segoe Script', cursive, var(--font-body)", color: "var(--navy)" }} />
              </div>

              <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", marginTop: "1rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
                <span>I agree that typing my name above constitutes my legal electronic signature on this document, and I consent to sign electronically under the E-SIGN Act and UETA.</span>
              </label>

              {error && <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginTop: "0.75rem" }}>{error}</p>}

              <button onClick={sign} disabled={submitting || !typedName.trim() || !consent}
                className="lf-btn lf-btn-primary" style={{ marginTop: "1.25rem", padding: "0.75rem 1.5rem", width: "100%", opacity: submitting || !typedName.trim() || !consent ? 0.6 : 1 }}>
                {submitting ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <ShieldCheck style={{ width: 18, height: 18 }} />} Sign document
              </button>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center" }}>Your name, the time, and your IP address are recorded as a legal audit trail.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
