"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, Circle, FileText, PenLine, Phone, Mail } from "lucide-react";

interface Stage { key: string; label: string; done: boolean; current: boolean }
interface Doc { id: string; title: string; documentType: string; signatureStatus: string }
interface Portal {
  firmName: string; firmEmail: string | null; firmPhone: string | null;
  clientName: string; matterTitle: string; matterNumber: string;
  progress: Stage[]; currentLabel: string; closed: boolean;
  outstandingBalance: number; documents: Doc[];
}

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/portal/${token}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: "6rem", textAlign: "center" }}><Loader2 style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: "var(--brand)" }} /></div>;
  if (!data) return <div style={{ maxWidth: 640, margin: "4rem auto", padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>This portal link isn&apos;t active. Please contact your law firm.</div>;

  const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, padding: "1.75rem", boxShadow: "var(--shadow-md)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.3rem", color: "var(--navy)" }}>{data.firmName}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Your case portal · {data.matterNumber}</div>
        </div>

        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>Hello {data.clientName}</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 700, color: "var(--navy)", margin: "0.25rem 0 0.35rem" }}>{data.matterTitle}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Current status: <b style={{ color: "var(--brand)" }}>{data.currentLabel}</b></p>

          {/* Progress tracker */}
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

        {/* Outstanding balance */}
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
                  {d.signatureStatus === "PENDING" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, background: "var(--warning-bg)", color: "var(--warning)", padding: "0.15rem 0.55rem", borderRadius: 999 }}>
                      <PenLine style={{ width: 12, height: 12 }} /> Needs signature
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact */}
        <div style={{ ...card, display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Questions about your case?</span>
          {data.firmEmail && <a href={`mailto:${data.firmEmail}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--brand)", fontSize: "0.88rem", textDecoration: "none" }}><Mail style={{ width: 15, height: 15 }} />{data.firmEmail}</a>}
          {data.firmPhone && <a href={`tel:${data.firmPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--brand)", fontSize: "0.88rem", textDecoration: "none" }}><Phone style={{ width: 15, height: 15 }} />{data.firmPhone}</a>}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>Powered by Linos Legal</p>
      </div>
    </div>
  );
}
