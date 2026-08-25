"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, Circle, FileText, PenLine, Phone, Mail, Upload, Lock, Clock, Send, MessagesSquare } from "lucide-react";

interface Stage { key: string; label: string; done: boolean; current: boolean }
interface Doc { id: string; title: string; documentType: string; signatureStatus: string; uploadedByClient?: boolean }
interface Msg { id: string; fromClient: boolean; authorName?: string | null; body: string; createdAt: string }
interface Portal {
  firmName: string; firmEmail: string | null; firmPhone: string | null;
  clientName: string; matterTitle: string; matterNumber: string;
  progress: Stage[]; currentLabel: string; closed: boolean;
  outstandingBalance: number; documents: Doc[]; messages: Msg[];
}

type Gate = "loading" | "pin" | "expired" | "inactive" | "ready";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Portal | null>(null);
  const [gate, setGate] = useState<Gate>("loading");
  const [pin, setPin] = useState("");            // accepted PIN, kept for the session
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (pinToUse: string) => {
    const res = await fetch(`/api/public/portal/${token}`, { headers: pinToUse ? { "x-portal-pin": pinToUse } : {} });
    const json = await res.json().catch(() => ({}));
    if (!json.success) { setGate("inactive"); return; }
    const d = json.data;
    if (d.expired) { setGate("expired"); return; }
    if (d.notActive) { setGate("inactive"); return; }
    if (d.requiresPin) { setGate("pin"); setPinError(!!d.pinError); return; }
    setData(d); setPin(pinToUse); setGate("ready");
  }, [token]);

  useEffect(() => { load(""); }, [load]);
  useEffect(() => { if (gate === "ready") threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }); }, [data?.messages, gate]);

  const submitPin = async (e: React.FormEvent) => { e.preventDefault(); if (pinInput.length >= 4) await load(pinInput); };

  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadMsg(null); setUploading(true);
      try {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch(`/api/public/portal/${token}/upload`, { method: "POST", body: fd, headers: pin ? { "x-portal-pin": pin } : {} });
        const json = await res.json();
        if (res.ok && json.success) { setUploadMsg("Uploaded — your firm has received it."); await load(pin); }
        else setUploadMsg(json.error || "Upload failed. Please try again.");
      } catch { setUploadMsg("Upload failed. Please try again."); }
      finally { setUploading(false); }
    }
    if (fileRef.current) fileRef.current.value = "";
  }, [token, pin, load]);

  const sendMessage = async () => {
    const body = msgText.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch(`/api/public/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(pin ? { "x-portal-pin": pin } : {}) },
        body: JSON.stringify({ message: body }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data.message) {
        setData((d) => d ? { ...d, messages: [...d.messages, json.data.message] } : d);
        setMsgText("");
      }
    } finally { setSending(false); }
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>{children}</div>
  );
  const gateCard: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 16, padding: "2rem", boxShadow: "var(--shadow-md)", maxWidth: 420, width: "100%", textAlign: "center" };

  if (gate === "loading") return shell(<Loader2 style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: "var(--gold)" }} />);

  if (gate === "inactive") return shell(
    <div style={gateCard}><p style={{ color: "var(--text-secondary)" }}>This portal link isn&apos;t active. Please contact your law firm.</p></div>
  );

  if (gate === "expired") return shell(
    <div style={gateCard}>
      <Clock style={{ width: 34, height: 34, color: "var(--warning)", margin: "0 auto 0.75rem" }} />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>This link has expired</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>Please contact your law firm for an updated portal link.</p>
    </div>
  );

  if (gate === "pin") return shell(
    <form onSubmit={submitPin} style={gateCard}>
      <Lock style={{ width: 34, height: 34, color: "var(--gold)", margin: "0 auto 0.75rem" }} />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Enter your access PIN</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: "0.4rem 0 1rem" }}>Your firm shared a PIN to open this portal.</p>
      <input
        value={pinInput}
        onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8)); setPinError(false); }}
        inputMode="numeric" autoFocus placeholder="••••"
        aria-label="Access PIN"
        style={{ width: "100%", textAlign: "center", letterSpacing: "0.4em", fontSize: "1.3rem", padding: "0.6rem", borderRadius: 10, border: `1px solid ${pinError ? "var(--danger)" : "var(--border-default)"}`, background: "var(--bg-base)", color: "var(--navy)" }}
      />
      {pinError && <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginTop: "0.5rem" }}>That PIN didn&apos;t match. Try again.</p>}
      <button type="submit" disabled={pinInput.length < 4} className="lf-btn lf-btn-gold" style={{ width: "100%", marginTop: "1rem", justifyContent: "center" }}>Unlock portal</button>
    </form>
  );

  if (!data) return null;

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const sameAsClient = norm(data.matterTitle) === norm(data.clientName);
  const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, padding: "1.75rem", boxShadow: "var(--shadow-md)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.3rem", color: "var(--navy)" }}>{data.firmName}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Your case portal · {data.matterNumber}</div>
        </div>

        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>Hello {data.clientName.split(/\s+/)[0] || data.clientName}</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 700, color: "var(--navy)", margin: "0.25rem 0 0.35rem" }}>{sameAsClient ? "Your matter" : data.matterTitle}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Current status: <b style={{ color: "var(--brand)" }}>{data.currentLabel}</b></p>

          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            {data.progress.map((s, i) => (
              <div key={s.key} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {s.done ? <CheckCircle2 style={{ width: 22, height: 22, color: "var(--success)" }} />
                    : s.current ? <div style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--brand)", boxSizing: "border-box" }} />
                    : <Circle style={{ width: 22, height: 22, color: "var(--border-default)" }} />}
                  {i < data.progress.length - 1 && <div style={{ width: 2, height: 26, background: s.done ? "var(--success)" : "var(--border-light)" }} />}
                </div>
                <div style={{ paddingTop: 1, paddingBottom: 12 }}>
                  <div style={{ fontWeight: s.current ? 700 : 600, color: s.done || s.current ? "var(--navy)" : "var(--text-muted)", fontSize: "0.95rem" }}>{s.label}</div>
                  {s.current && <div style={{ fontSize: "0.78rem", color: "var(--brand)" }}>We&apos;re here now</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.outstandingBalance > 0 && (
          <div style={{ ...card, marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Balance due</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>{money(data.outstandingBalance)}</div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Contact your firm to pay.</span>
          </div>
        )}

        {/* Documents */}
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.9rem" }}>Your documents</h3>
          {data.documents.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>No documents shared yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.documents.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.7rem", borderRadius: 8, background: "var(--bg-base)" }}>
                  <FileText style={{ width: 18, height: 18, color: "var(--gold)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.9rem", color: "var(--navy)", fontWeight: 500 }}>{d.title}</span>
                  {d.uploadedByClient && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "var(--success-bg)", color: "var(--success)", padding: "0.15rem 0.55rem", borderRadius: 999 }}>You uploaded</span>
                  )}
                  {d.signatureStatus === "PENDING" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, background: "var(--warning-bg)", color: "var(--warning)", padding: "0.15rem 0.55rem", borderRadius: 999 }}>
                      <PenLine style={{ width: 12, height: 12 }} /> Needs signature
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "1.1rem", paddingTop: "1.1rem", borderTop: "1px solid var(--border-light)" }}>
            <input ref={fileRef} type="file" onChange={onUpload} style={{ display: "none" }} disabled={uploading} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 1rem" }}>
              {uploading ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 16, height: 16 }} />}
              {uploading ? "Uploading…" : "Send us a document"}
            </button>
            {uploadMsg && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.6rem" }}>{uploadMsg}</p>}
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>PDFs, images, or documents up to 15&nbsp;MB.</p>
          </div>
        </div>

        {/* Secure messaging */}
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.9rem" }}>
            <MessagesSquare style={{ width: 17, height: 17, color: "var(--gold)" }} /> Messages
          </h3>
          <div ref={threadRef} style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.85rem" }}>
            {data.messages.length === 0 ? (
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>No messages yet. Send your firm a question below.</p>
            ) : data.messages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.fromClient ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                <div style={{
                  padding: "0.55rem 0.75rem", borderRadius: 14, fontSize: "0.9rem", lineHeight: 1.45,
                  background: m.fromClient ? "var(--brand, var(--gold))" : "var(--bg-base)",
                  color: m.fromClient ? "#422006" : "var(--navy)",
                  border: m.fromClient ? "none" : "1px solid var(--border-default)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>{m.body}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2, textAlign: m.fromClient ? "right" : "left" }}>
                  {m.fromClient ? "You" : (m.authorName || data.firmName)} · {fmt(m.createdAt)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendMessage(); } }}
              placeholder="Write a message to your firm…"
              rows={2}
              style={{ flex: 1, padding: "0.55rem 0.65rem", borderRadius: 10, border: "1px solid var(--border-default)", fontSize: "0.9rem", resize: "vertical", fontFamily: "inherit", background: "var(--bg-base)", color: "var(--navy)" }}
            />
            <button onClick={sendMessage} disabled={sending || !msgText.trim()} className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 0.85rem" }} aria-label="Send message">
              {sending ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Please don&apos;t share highly sensitive information here until your firm confirms representation.</p>
        </div>

        {/* Contact */}
        <div style={{ ...card, display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Questions about your case?</span>
          {data.firmEmail && <a href={`mailto:${data.firmEmail}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--brand)", fontSize: "0.88rem", textDecoration: "none" }}><Mail style={{ width: 15, height: 15 }} />{data.firmEmail}</a>}
          {data.firmPhone && <a href={`tel:${data.firmPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--brand)", fontSize: "0.88rem", textDecoration: "none" }}><Phone style={{ width: 15, height: 15 }} />{data.firmPhone}</a>}
          {!data.firmEmail && !data.firmPhone && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Use the messages above and your firm will be glad to help.</span>}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>Powered by Linoscore Legal</p>
      </div>
    </div>
  );
}
