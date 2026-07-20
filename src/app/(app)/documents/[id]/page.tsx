"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Download, Upload, Trash2, History, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { DOC_TYPE_LABELS, SIGNATURE_LABELS, humanSize } from "@/lib/doc-display";

interface Version { id: string; versionNumber: number; fileName: string; mimeType: string; size: number; createdAt: string; }
interface DocDetail {
  id: string; title: string; originalName: string; documentType: string; tags: string[];
  aiSummary: string | null; aiParties: string[]; signatureStatus: string;
  currentVersionId: string | null; createdAt: string;
  versions: Version[];
  case: { id: string; title: string; caseNumber: string } | null;
  client: { id: string; name: string } | null;
}

const TYPES = Object.keys(DOC_TYPE_LABELS);
const SIGS = Object.keys(SIGNATURE_LABELS);

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/documents/${id}`);
    const json = await res.json();
    if (json.success) setDoc(json.data); else toast.error("Not found");
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { toast.error("Update failed"); return; }
      toast.success(msg); await load();
    } finally { setBusy(false); }
  };

  const uploadVersion = async (file: File) => {
    setBusy(true);
    const t = toast.loading("Uploading new version…");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`/api/v1/documents/${id}/versions`, { method: "POST", body: fd });
      toast.dismiss(t);
      if (!res.ok) { toast.error("Failed to add version"); return; }
      toast.success("New version uploaded"); await load();
    } finally { setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  const del = async () => {
    if (!confirm("Delete this document and all its versions?")) return;
    const res = await fetch(`/api/v1/documents/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); router.push("/documents"); } else toast.error("Delete failed");
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>;
  if (!doc) return <div style={{ padding: "2rem" }}>Not found. <Link href="/documents" style={{ color: "var(--gold)" }}>Back</Link></div>;

  const currentVersion = doc.versions.find((v) => v.id === doc.currentVersionId) || doc.versions[0];

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <Link href="/documents" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem", textDecoration: "none" }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to documents
      </Link>

      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FileText style={{ width: 24, height: 24, color: "var(--gold)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>{doc.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: 2 }}>{doc.originalName}</p>
        </div>
        {currentVersion && (
          <a href={`/api/v1/documents/${id}/versions/${currentVersion.id}/download`} className="lf-btn lf-btn-gold" style={{ padding: "0.625rem 1rem" }}>
            <Download style={{ width: 16, height: 16 }} /> Download
          </a>
        )}
      </div>

      {/* Metadata / actions */}
      <div className="lf-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Type</label>
          <select className="lf-input" value={doc.documentType} disabled={busy} onChange={(e) => patch({ documentType: e.target.value }, "Type updated")} style={{ width: "auto", padding: "0.4rem 0.6rem" }}>
            {TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Signature</label>
          <select className="lf-input" value={doc.signatureStatus} disabled={busy} onChange={(e) => patch({ signatureStatus: e.target.value }, "Signature status updated")} style={{ width: "auto", padding: "0.4rem 0.6rem" }}>
            {SIGS.map((s) => <option key={s} value={s}>{SIGNATURE_LABELS[s]}</option>)}
          </select>
        </div>
        {doc.case && <div><label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Case</label><span style={{ fontSize: "0.875rem", color: "var(--navy)" }}>{doc.case.caseNumber}</span></div>}
        <div style={{ flex: 1 }} />
        <button onClick={() => fileInput.current?.click()} disabled={busy} className="lf-btn" style={{ padding: "0.5rem 0.875rem", background: "var(--bg-base)", color: "var(--navy)" }}>
          <Upload style={{ width: 16, height: 16 }} /> New version
        </button>
        <input ref={fileInput} type="file" hidden onChange={(e) => e.target.files?.[0] && uploadVersion(e.target.files[0])} />
        <button onClick={del} className="lf-btn" style={{ padding: "0.5rem 0.75rem", background: "var(--danger-bg, #fbe9e9)", color: "var(--danger, #c0392b)" }}>
          <Trash2 style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* AI organization */}
        <div className="lf-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1rem" }}>
            <Sparkles style={{ width: 18, height: 18, color: "var(--gold)" }} /> AI Organization
          </h3>
          {!doc.aiSummary ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No AI analysis yet. (Runs on upload when an OpenAI key is configured; scanned images also need the key for OCR.)</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{doc.aiSummary}</p>
              {doc.aiParties?.length > 0 && (
                <div><div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Parties</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--navy)" }}>{doc.aiParties.join(", ")}</div></div>
              )}
              {doc.tags?.length > 0 && (
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {doc.tags.map((t) => <span key={t} style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-base)", padding: "0.15rem 0.5rem", borderRadius: 4 }}>#{t}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Version history */}
        <div className="lf-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1rem" }}>
            <History style={{ width: 18, height: 18, color: "var(--gold)" }} /> Version History
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {doc.versions.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.75rem", borderRadius: 8, background: v.id === doc.currentVersionId ? "var(--gold-bg, #faf6ec)" : "var(--bg-base)" }}>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)" }}>
                    v{v.versionNumber} {v.id === doc.currentVersionId && <span style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 700 }}>· current</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{humanSize(v.size)} · {new Date(v.createdAt).toLocaleString()}</div>
                </div>
                <a href={`/api/v1/documents/${id}/versions/${v.id}/download`} style={{ color: "var(--gold)", display: "inline-flex" }}><Download style={{ width: 16, height: 16 }} /></a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
