export const DOC_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contract",
  PLEADING: "Pleading",
  COURT_FILING: "Court Filing",
  CORRESPONDENCE: "Correspondence",
  EVIDENCE: "Evidence",
  DISCOVERY: "Discovery",
  INVOICE: "Invoice",
  IDENTIFICATION: "ID Document",
  ENGAGEMENT_LETTER: "Engagement Letter",
  MEMO: "Memo",
  OTHER: "Other",
};

export const SIGNATURE_LABELS: Record<string, string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Needs signature",
  SIGNED: "Signed",
};

export function signatureStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case "SIGNED":
      return { bg: "var(--success-bg, #e6f4ec)", text: "var(--success, #2e7d5b)" };
    case "PENDING":
      return { bg: "var(--warning-bg, #fbf1e0)", text: "var(--warning, #b7791f)" };
    default:
      return { bg: "rgba(15,27,51,0.06)", text: "var(--text-secondary)" };
  }
}

// Smart folders = saved filter presets. `params` are appended to the list query.
export type SmartFolder = { key: string; label: string; params: Record<string, string> };
export const SMART_FOLDERS: SmartFolder[] = [
  { key: "all", label: "All documents", params: {} },
  { key: "contracts", label: "Contracts", params: { type: "CONTRACT" } },
  { key: "pleadings", label: "Pleadings", params: { type: "PLEADING" } },
  { key: "filings", label: "Court filings", params: { type: "COURT_FILING" } },
  { key: "correspondence", label: "Correspondence", params: { type: "CORRESPONDENCE" } },
  { key: "evidence", label: "Evidence", params: { type: "EVIDENCE" } },
  { key: "invoices", label: "Invoices", params: { type: "INVOICE" } },
  { key: "needs-sig", label: "Needs signature", params: { signature: "PENDING" } },
  { key: "signed", label: "Signed", params: { signature: "SIGNED" } },
];

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
