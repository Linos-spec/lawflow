"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Upload, UploadCloud, Search, FileText, Sparkles, FolderOpen,
  Files, FileSignature, Scale, Landmark, Mail, Paperclip, Receipt, PenLine, FileCheck2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import { DOC_TYPE_LABELS, SIGNATURE_LABELS, signatureStyle, SMART_FOLDERS } from "@/lib/doc-display";

interface DocRow {
  id: string;
  title: string;
  originalName: string;
  documentType: string;
  tags: string[];
  signatureStatus: string;
  aiSummary: string | null;
  updatedAt: string;
}

// Icon per smart folder — a small system to aid scanning.
const FOLDER_ICONS: Record<string, LucideIcon> = {
  all: Files,
  contracts: FileSignature,
  pleadings: Scale,
  filings: Landmark,
  correspondence: Mail,
  evidence: Paperclip,
  invoices: Receipt,
  "needs-sig": PenLine,
  signed: FileCheck2,
};

// Does a document belong in a given smart folder (client-side, for counts)?
function matchesFolder(d: DocRow, params: Record<string, string>): boolean {
  if (params.type && d.documentType !== params.type) return false;
  if (params.signature && d.signatureStatus !== params.signature) return false;
  return true;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("all");
  const [q, setQ] = useState("");
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const preset = SMART_FOLDERS.find((f) => f.key === folder)?.params || {};
      const params = new URLSearchParams(preset);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/v1/documents?${params.toString()}`);
      const json = await res.json();
      if (json.success) setDocs(json.data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [folder, q]);

  // Per-folder counts from the full set (one fetch, bucketed client-side).
  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/documents`);
      const json = await res.json();
      if (json.success) {
        const all: DocRow[] = json.data;
        const c: Record<string, number> = {};
        for (const f of SMART_FOLDERS) c[f.key] = all.filter((d) => matchesFolder(d, f.params)).length;
        setCounts(c);
      }
    } catch { /* counts are non-critical */ }
  }, []);

  useEffect(() => { load(); }, [folder]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const onUpload = async (file: File) => {
    setUploading(true);
    const t = toast.loading(`Uploading & analyzing “${file.name}”…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/documents", { method: "POST", body: fd });
      const json = await res.json();
      toast.dismiss(t);
      if (!res.ok) { toast.error(json.error || "Upload failed"); return; }
      toast.success("Document uploaded & organized");
      load();
      loadCounts();
    } catch {
      toast.dismiss(t);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !uploading) onUpload(file);
  };

  const activeFolderLabel = SMART_FOLDERS.find((f) => f.key === folder)?.label || "Documents";

  return (
    <>
      <PageHeader
        title="Documents"
        icon={FolderOpen}
        subtitle="Uploads are OCR'd, auto-titled, tagged, and organized by AI."
        actions={
          <button onClick={() => fileInput.current?.click()} disabled={uploading} className="lf-btn lf-btn-gold" style={{ padding: "0.625rem 1.25rem", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 18, height: 18 }} />} Upload
          </button>
        }
      />
      <input ref={fileInput} type="file" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />

      {/* One cohesive workspace frame: folders + content share a card, capped width. */}
      <div style={{ maxWidth: 1160 }}>
        <div className="lf-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "236px 1fr" }}>
          {/* Smart folders */}
          <aside style={{ borderRight: "1px solid var(--border-default)", background: "var(--bg-base)", padding: "1.1rem 0.75rem" }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.6rem", paddingLeft: "0.5rem" }}>Smart folders</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SMART_FOLDERS.map((f) => {
                const Icon = FOLDER_ICONS[f.key] || FileText;
                const selected = folder === f.key;
                const isHover = hovered === f.key;
                const count = counts[f.key];
                return (
                  <button
                    key={f.key}
                    onClick={() => setFolder(f.key)}
                    onMouseEnter={() => setHovered(f.key)}
                    onMouseLeave={() => setHovered((h) => (h === f.key ? null : h))}
                    aria-current={selected ? "true" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
                      textAlign: "left", padding: "0.5rem 0.7rem", borderRadius: 8, fontSize: "0.875rem",
                      cursor: "pointer", border: "none", transition: "background 0.12s, color 0.12s",
                      boxShadow: selected ? "inset 3px 0 0 var(--gold)" : "none",
                      background: selected ? "var(--bg-card)" : isHover ? "rgba(15,23,42,0.05)" : "transparent",
                      color: selected ? "var(--navy)" : "var(--text-secondary)",
                      fontWeight: selected ? 700 : 500,
                    }}
                  >
                    <Icon style={{ width: 16, height: 16, flexShrink: 0, color: selected ? "var(--gold)" : "var(--text-muted)" }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                    {count != null && count > 0 && (
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: selected ? "var(--navy)" : "var(--text-muted)", background: selected ? "var(--gold-bg, #fef3e2)" : "rgba(15,23,42,0.05)", padding: "0.05rem 0.4rem", borderRadius: 999, minWidth: 20, textAlign: "center" }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <section
            style={{ padding: "1.25rem 1.5rem", minWidth: 0 }}
            onDragOver={(e) => { e.preventDefault(); if (!dragging) setDragging(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
            onDrop={onDrop}
          >
            {/* Integrated search — one control, button attached inside the field */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-card)", padding: "0.15rem 0.15rem 0.15rem 0.75rem", marginBottom: "1.1rem" }}>
              <Search style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Search inside documents — OCR text, titles, tags…"
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "0.9rem", color: "var(--navy)", padding: "0.5rem 0" }}
              />
              <button onClick={load} className="lf-btn lf-btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>Search</button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
            ) : docs.length === 0 ? (
              /* Rich, actionable empty state — also a drop zone */
              <div
                style={{
                  border: `2px dashed ${dragging ? "var(--gold)" : "var(--border-default)"}`,
                  background: dragging ? "var(--gold-bg, #fef9ef)" : "var(--bg-base)",
                  borderRadius: 14, padding: "2.75rem 1.5rem", textAlign: "center", transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--gold-bg, #fef3e2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <UploadCloud style={{ width: 28, height: 28, color: "var(--gold)" }} />
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem" }}>
                  {q.trim() ? "No matching documents" : folder === "all" ? "No documents yet" : `No documents in ${activeFolderLabel}`}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: 420, margin: "0 auto 1.25rem" }}>
                  {q.trim()
                    ? "Try a different search, or upload a new document."
                    : "Drag a file here or upload one — AI will title, tag, and file it automatically."}
                </p>
                <button onClick={() => fileInput.current?.click()} disabled={uploading} className="lf-btn lf-btn-gold" style={{ padding: "0.6rem 1.25rem", opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 16, height: 16 }} />}
                  Upload your first document
                </button>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.9rem" }}>PDF, Word, images, or text · up to 15&nbsp;MB</p>
              </div>
            ) : (
              <>
                {dragging && (
                  <div style={{ border: "2px dashed var(--gold)", background: "var(--gold-bg, #fef9ef)", borderRadius: 12, padding: "0.75rem", textAlign: "center", marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--navy)", fontWeight: 600 }}>
                    Drop to upload
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {docs.map((d) => {
                    const sig = signatureStyle(d.signatureStatus);
                    return (
                      <div key={d.id} onClick={() => router.push(`/documents/${d.id}`)} className="lf-card" style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "flex-start", border: "1px solid var(--border-default)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText style={{ width: 20, height: 20, color: "var(--gold)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, color: "var(--navy)" }}>{d.title}</span>
                            <span style={{ fontSize: "0.7rem", background: "rgba(15,27,51,0.06)", color: "var(--text-secondary)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>{DOC_TYPE_LABELS[d.documentType] || d.documentType}</span>
                            {d.signatureStatus !== "NOT_REQUIRED" && (
                              <span style={{ fontSize: "0.7rem", background: sig.bg, color: sig.text, padding: "0.1rem 0.5rem", borderRadius: 999, fontWeight: 600 }}>{SIGNATURE_LABELS[d.signatureStatus]}</span>
                            )}
                          </div>
                          {d.aiSummary && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.aiSummary}</p>}
                          {d.tags?.length > 0 && (
                            <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                              {d.tags.slice(0, 5).map((t) => <span key={t} style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "var(--bg-base)", padding: "0.1rem 0.5rem", borderRadius: 4 }}>#{t}</span>)}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>{new Date(d.updatedAt).toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkles style={{ width: 12, height: 12 }} /> Titles and tags are AI-generated on upload.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
