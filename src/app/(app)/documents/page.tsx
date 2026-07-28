"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Search, FileText, Sparkles, FolderOpen } from "lucide-react";
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

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("all");
  const [q, setQ] = useState("");
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

  useEffect(() => { load(); }, [folder]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch {
      toast.dismiss(t);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

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

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }}>
        {/* Smart folders */}
        <div>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.5rem", paddingLeft: "0.5rem" }}>Smart folders</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SMART_FOLDERS.map((f) => (
              <button key={f.key} onClick={() => setFolder(f.key)} style={{
                textAlign: "left", padding: "0.5rem 0.75rem", borderRadius: 8, fontSize: "0.875rem", cursor: "pointer", border: "none",
                background: folder === f.key ? "var(--gold-bg, #faf6ec)" : "transparent",
                color: folder === f.key ? "var(--navy)" : "var(--text-secondary)",
                fontWeight: folder === f.key ? 600 : 400,
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-muted)" }} />
              <input className="lf-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Search inside documents (OCR text, titles, tags)…" style={{ paddingLeft: 36 }} />
            </div>
            <button onClick={load} className="lf-btn" style={{ padding: "0 1rem", background: "var(--bg-base)", color: "var(--navy)" }}>Search</button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>
          ) : docs.length === 0 ? (
            <div className="lf-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No documents here. Upload one to get started — AI will title, tag, and file it automatically.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {docs.map((d) => {
                const sig = signatureStyle(d.signatureStatus);
                return (
                  <div key={d.id} onClick={() => router.push(`/documents/${d.id}`)} className="lf-card" style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
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
          )}
          {!loading && docs.length > 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", display: "flex", alignItems: "center", gap: 4 }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Titles and tags are AI-generated on upload.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
