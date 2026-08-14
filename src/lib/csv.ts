/**
 * Tiny dependency-free CSV toolkit for the case importer.
 * parseCsv handles quoted fields, embedded commas/newlines, and "" escapes
 * (RFC 4180-ish). Good enough for spreadsheet exports; not a full streaming lib.
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export function parseCsv(input: string): ParsedCsv {
  // Strip a UTF-8 BOM if present.
  const text = input.replace(/^﻿/, "");
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => { record.push(field); field = ""; };
  const pushRecord = () => { records.push(record); record = []; };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { pushField(); pushRecord(); i++; continue; }
    field += c; i++;
  }
  // Flush trailing field/record (unless the file ended on a clean newline).
  if (field.length > 0 || record.length > 0) { pushField(); pushRecord(); }

  // Drop fully-empty trailing rows.
  const cleaned = records.filter((r) => r.some((v) => v.trim() !== ""));
  if (cleaned.length === 0) return { headers: [], rows: [] };

  const headers = cleaned[0].map((h) => h.trim());
  const rows = cleaned.slice(1);
  return { headers, rows };
}

/** Fields the importer knows how to map onto a matter. */
export const IMPORT_FIELDS = [
  { key: "matterName", label: "Matter name", required: true },
  { key: "clientName", label: "Client name", required: true },
  { key: "matterType", label: "Matter type", required: false },
  { key: "status", label: "Status", required: false },
  { key: "openDate", label: "Open date", required: false },
  { key: "description", label: "Description", required: false },
  { key: "referenceNumber", label: "Reference number", required: false },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

/** A downloadable starter template with the expected headers + one example row. */
export function buildTemplateCsv(): string {
  const headers = ["Matter name", "Client name", "Matter type", "Status", "Open date", "Description", "Reference number"];
  const example = ["Doe v. Roe", "Jane Doe", "Family", "Open", "2026-01-15", "Custody dispute", "MAT-1001"];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return headers.map(esc).join(",") + "\n" + example.map(esc).join(",") + "\n";
}

/** Guess which CSV header maps to a given field, by normalized name match. */
export function guessHeader(fieldKey: ImportFieldKey, fieldLabel: string, headers: string[]): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(fieldLabel);
  const aliases: Record<string, string[]> = {
    matterName: ["matter", "mattername", "casename", "case", "title", "name"],
    clientName: ["client", "clientname", "customer", "party"],
    matterType: ["type", "mattertype", "casetype", "practicearea", "area"],
    status: ["status", "state", "stage"],
    openDate: ["opendate", "dateopened", "opened", "startdate", "filed", "filingdate"],
    description: ["description", "desc", "notes", "summary"],
    referenceNumber: ["reference", "referencenumber", "refno", "ref", "casenumber", "matternumber", "number"],
  };
  const cands = new Set([target, ...(aliases[fieldKey] || [])]);
  for (const h of headers) {
    const nh = norm(h);
    if (cands.has(nh)) return h;
  }
  // looser contains match
  for (const h of headers) {
    const nh = norm(h);
    for (const c of cands) if (c.length >= 4 && (nh.includes(c) || c.includes(nh))) return h;
  }
  return null;
}
