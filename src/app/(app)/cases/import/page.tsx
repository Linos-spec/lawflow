"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, Download, CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { parseCsv, buildTemplateCsv, guessHeader, IMPORT_FIELDS, type ImportFieldKey } from "@/lib/csv";
import { track } from "@/lib/analytics";

type Step = "upload" | "map" | "preview" | "result";
type Mapping = Record<ImportFieldKey, number>; // header index, or -1

interface ImportResult {
  imported: { row: number; caseNumber: string; warnings: string[] }[];
  skipped: { row: number; reason: string }[];
  failed: { row: number; error: string }[];
  counts: { imported: number; skipped: number; failed: number; clientsCreated: number; total: number };
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function ImportCasesPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({} as Mapping);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob([buildTemplateCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "linos-cases-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please choose a .csv file"); return;
    }
    if (file.size > MAX_BYTES) { toast.error("File is larger than 5 MB"); return; }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      toast.error("That file has no data rows"); return;
    }
    const initial = {} as Mapping;
    for (const f of IMPORT_FIELDS) {
      const g = guessHeader(f.key, f.label, parsed.headers);
      initial[f.key] = g ? parsed.headers.indexOf(g) : -1;
    }
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(initial);
    setStep("map");
    track("case_import_started", { rows: parsed.rows.length, columns: parsed.headers.length });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const requiredMapped = IMPORT_FIELDS.filter((f) => f.required).every((f) => mapping[f.key] >= 0);

  // Build mapped rows for preview/submit.
  const mapped = useMemo(() => {
    return rows.map((cells) => {
      const get = (k: ImportFieldKey) => { const idx = mapping[k]; return idx >= 0 ? (cells[idx] ?? "").trim() : ""; };
      const obj = {
        matterName: get("matterName"),
        clientName: get("clientName"),
        matterType: get("matterType"),
        status: get("status"),
        openDate: get("openDate"),
        description: get("description"),
        referenceNumber: get("referenceNumber"),
      };
      const errors: string[] = [];
      if (!obj.matterName) errors.push("Matter name");
      if (!obj.clientName) errors.push("Client name");
      return { obj, errors };
    });
  }, [rows, mapping]);

  const validCount = mapped.filter((m) => m.errors.length === 0).length;
  const invalidCount = mapped.length - validCount;

  const goPreview = () => {
    if (!requiredMapped) { toast.error("Map Matter name and Client name first"); return; }
    setStep("preview");
    track("case_import_validated", { valid: validCount, invalid: invalidCount, total: mapped.length });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/cases/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mapped.map((m) => m.obj) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        track("case_import_failed", { reason: "request" });
        toast.error(json.error || "Import failed"); return;
      }
      setResult(json.data);
      setStep("result");
      if (json.data.counts.imported > 0) {
        track("case_import_completed", json.data.counts);
        toast.success(`Imported ${json.data.counts.imported} matter${json.data.counts.imported === 1 ? "" : "s"}`);
      } else {
        track("case_import_failed", { reason: "none_created" });
      }
    } catch {
      track("case_import_failed", { reason: "network" });
      toast.error("Couldn't reach the server");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <Link href="/cases" className="lf-btn lf-btn-ghost" style={{ padding: "0.35rem 0.6rem", marginBottom: "0.5rem" }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to cases
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>Import cases</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>Bring matters in from a CSV — map columns, review, then confirm.</p>
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2 text-sm" aria-label="Import steps">
        {(["upload", "map", "preview", "result"] as Step[]).map((s, i) => {
          const labels = { upload: "Upload", map: "Map columns", preview: "Review", result: "Done" };
          const order = ["upload", "map", "preview", "result"];
          const active = order.indexOf(step) >= i;
          return (
            <li key={s} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5" style={{ color: active ? "var(--navy)" : "var(--text-muted)", fontWeight: active ? 600 : 400 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                  background: active ? "var(--gold)" : "var(--border-default)", color: active ? "#fff" : "var(--text-muted)" }}>{i + 1}</span>
                {labels[s]}
              </span>
              {i < 3 && <span style={{ color: "var(--border-default)" }}>—</span>}
            </li>
          );
        })}
      </ol>

      {/* STEP 1 — Upload */}
      {step === "upload" && (
        <div className="lf-card" style={{ padding: "1.5rem" }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            aria-label="Upload a CSV file"
            style={{
              border: `2px dashed ${dragOver ? "var(--gold)" : "var(--border-default)"}`,
              background: dragOver ? "var(--gold-bg, #fef3e2)" : "var(--bg-base)",
              borderRadius: 14, padding: "2.5rem 1.5rem", textAlign: "center", cursor: "pointer",
            }}
          >
            <Upload style={{ width: 30, height: 30, color: "var(--gold)", margin: "0 auto 0.75rem" }} aria-hidden />
            <p style={{ fontWeight: 600, color: "var(--navy)" }}>Drag & drop a CSV, or click to choose</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>CSV files only · up to 5 MB</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: "1rem", flexWrap: "wrap" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong>Required columns:</strong> Matter name, Client name. Optional: Matter type, Status, Open date, Description, Reference number.
            </p>
            <button onClick={downloadTemplate} className="lf-btn lf-btn-outline">
              <Download style={{ width: 16, height: 16 }} /> Download template
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Map columns */}
      {step === "map" && (
        <div className="lf-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            <FileText style={{ width: 16, height: 16 }} /> {fileName} · {rows.length} row{rows.length === 1 ? "" : "s"}
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {IMPORT_FIELDS.map((f) => (
              <div key={f.key} style={{ display: "grid", gridTemplateColumns: "minmax(140px, 220px) 1fr", alignItems: "center", gap: "1rem" }}>
                <label htmlFor={`map-${f.key}`} style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" }}>
                  {f.label} {f.required && <span style={{ color: "var(--danger)" }} aria-label="required">*</span>}
                </label>
                <select
                  id={`map-${f.key}`}
                  className="lf-input"
                  value={mapping[f.key] ?? -1}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: parseInt(e.target.value) }))}
                >
                  <option value={-1}>— Not mapped —</option>
                  {headers.map((h, idx) => <option key={idx} value={idx}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: "1.5rem" }}>
            <button onClick={() => setStep("upload")} className="lf-btn lf-btn-ghost">Back</button>
            <button onClick={goPreview} disabled={!requiredMapped} className="lf-btn lf-btn-gold">
              Review <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="lf-badge" style={{ background: "var(--success-bg)", color: "var(--success)" }}>{validCount} ready</span>
            {invalidCount > 0 && <span className="lf-badge" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{invalidCount} with errors (will be skipped)</span>}
          </div>
          <div className="lf-card" style={{ padding: 0, overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
            <table className="lf-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Matter</th><th>Client</th><th>Type</th><th>Status</th><th>Open date</th><th>Row status</th>
                </tr>
              </thead>
              <tbody>
                {mapped.map((m, i) => {
                  const ok = m.errors.length === 0;
                  return (
                    <tr key={i}>
                      <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td style={{ color: "var(--navy)", fontWeight: 500 }}>{m.obj.matterName || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                      <td>{m.obj.clientName || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{m.obj.matterType || "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{m.obj.status || "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{m.obj.openDate || "—"}</td>
                      <td>
                        {ok ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--success)", fontSize: "0.8rem", fontWeight: 600 }}>
                            <CheckCircle2 style={{ width: 14, height: 14 }} /> Ready
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--danger)", fontSize: "0.8rem", fontWeight: 600 }}>
                            <AlertTriangle style={{ width: 14, height: 14 }} /> Missing {m.errors.join(" & ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <button onClick={() => setStep("map")} className="lf-btn lf-btn-ghost">Back</button>
            <button onClick={submit} disabled={submitting || validCount === 0} className="lf-btn lf-btn-gold">
              {submitting ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 16, height: 16 }} />}
              Import {validCount} matter{validCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Result */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className="lf-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <CheckCircle2 style={{ width: 22, height: 22, color: "var(--success)" }} />
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, color: "var(--navy)" }}>Import complete</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="lf-badge" style={{ background: "var(--success-bg)", color: "var(--success)" }}>{result.counts.imported} imported</span>
              {result.counts.clientsCreated > 0 && <span className="lf-badge" style={{ background: "rgba(15,27,51,0.08)", color: "var(--navy)" }}>{result.counts.clientsCreated} new client{result.counts.clientsCreated === 1 ? "" : "s"}</span>}
              {result.counts.skipped > 0 && <span className="lf-badge" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>{result.counts.skipped} skipped</span>}
              {result.counts.failed > 0 && <span className="lf-badge" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{result.counts.failed} failed</span>}
            </div>
          </div>

          {(result.skipped.length > 0 || result.failed.length > 0) && (
            <div className="lf-card" style={{ padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>Rows that need attention</p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.skipped.map((s) => (
                  <li key={`s${s.row}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <AlertTriangle style={{ width: 14, height: 14, color: "var(--warning)", flexShrink: 0 }} /> Row {s.row}: {s.reason}
                  </li>
                ))}
                {result.failed.map((f) => (
                  <li key={`f${f.row}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <XCircle style={{ width: 14, height: 14, color: "var(--danger)", flexShrink: 0 }} /> Row {f.row}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => router.push("/cases")} className="lf-btn lf-btn-gold">View cases</button>
            <button onClick={() => { setStep("upload"); setResult(null); setRows([]); setHeaders([]); setFileName(""); }} className="lf-btn lf-btn-outline">Import another file</button>
          </div>
        </div>
      )}
    </div>
  );
}
