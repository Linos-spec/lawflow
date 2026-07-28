/**
 * Immigration practice-area module — the beachhead vertical.
 *
 * Curated, deterministic domain knowledge (matter subtypes, forms, starter
 * checklists) so immigration matters get correct terminology and day-one tasks
 * instead of generic AI guesses. All dates are relative-day suggestions the
 * supervising attorney MUST verify against current USCIS/EOIR rules.
 */

export interface ImmigrationMatterType {
  key: string;
  label: string;
  form: string;   // primary USCIS/EOIR form
  agency: "USCIS" | "EOIR" | "DOS" | "DOL";
}

export const IMMIGRATION_MATTER_TYPES: ImmigrationMatterType[] = [
  { key: "family_petition",   label: "Family-based petition",         form: "I-130",  agency: "USCIS" },
  { key: "adjustment",        label: "Adjustment of status",          form: "I-485",  agency: "USCIS" },
  { key: "naturalization",    label: "Naturalization / citizenship",  form: "N-400",  agency: "USCIS" },
  { key: "employment",        label: "Employment-based petition",     form: "I-140",  agency: "USCIS" },
  { key: "asylum",            label: "Asylum",                        form: "I-589",  agency: "USCIS" },
  { key: "removal_defense",   label: "Removal / deportation defense", form: "EOIR-28", agency: "EOIR" },
  { key: "daca",              label: "DACA",                          form: "I-821D", agency: "USCIS" },
  { key: "u_visa",            label: "U visa (crime victim)",         form: "I-918",  agency: "USCIS" },
  { key: "t_visa",            label: "T visa (trafficking victim)",   form: "I-914",  agency: "USCIS" },
  { key: "vawa",              label: "VAWA self-petition",            form: "I-360",  agency: "USCIS" },
  { key: "tps",               label: "Temporary Protected Status",    form: "I-821",  agency: "USCIS" },
  { key: "work_auth",         label: "Work authorization (EAD)",      form: "I-765",  agency: "USCIS" },
  { key: "green_card_renewal",label: "Green card renewal/replace",    form: "I-90",   agency: "USCIS" },
  { key: "fiance_visa",       label: "Fiancé(e) visa",                form: "I-129F", agency: "USCIS" },
  { key: "consular",          label: "Consular processing",           form: "DS-260", agency: "DOS" },
];

export function isImmigrationMatterType(key: string): boolean {
  return IMMIGRATION_MATTER_TYPES.some((t) => t.key === key);
}

export type StarterTask = {
  title: string;
  dueInDays: number;
  deadlineType: "FILING" | "CLIENT_MEETING" | "DISCOVERY" | "INTERNAL" | "COURT_APPEARANCE" | "STATUTE_OF_LIMITATIONS" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  rationale: string;
};

/**
 * Day-one checklist common to most affirmative immigration filings.
 * Attorney-verify — these are workflow suggestions, not authoritative deadlines.
 */
export function immigrationStarterChecklist(): StarterTask[] {
  return [
    { title: "Confirm eligibility & correct form/category", dueInDays: 2, deadlineType: "INTERNAL", priority: "HIGH", rationale: "Filing the wrong category is the most common costly error" },
    { title: "Collect identity documents (passport, prior USCIS notices, I-94)", dueInDays: 7, deadlineType: "CLIENT_MEETING", priority: "HIGH", rationale: "Required supporting evidence" },
    { title: "Gather supporting evidence (relationship / eligibility proof)", dueInDays: 14, deadlineType: "CLIENT_MEETING", priority: "MEDIUM", rationale: "Bona fides / eligibility packet" },
    { title: "Prepare and internally review the petition", dueInDays: 21, deadlineType: "INTERNAL", priority: "MEDIUM", rationale: "Quality-check before filing" },
    { title: "Confirm current USCIS/EOIR filing fee & address", dueInDays: 21, deadlineType: "INTERNAL", priority: "HIGH", rationale: "Fees and lockbox addresses change frequently" },
    { title: "File petition with USCIS/EOIR", dueInDays: 30, deadlineType: "FILING", priority: "HIGH", rationale: "Initiate the case" },
    { title: "Calendar biometrics / receipt-notice follow-up", dueInDays: 45, deadlineType: "OTHER", priority: "MEDIUM", rationale: "Track case progress after filing" },
  ];
}

/** Immigration-specific terminology used across the segment UI/copy. */
export const IMMIGRATION_TERMS = {
  matter: "case",
  intakePrompt: "Tell us about your immigration situation",
  proofOfService: "filing receipt notice",
};

/**
 * Evidence a client typically must provide for immigration filings. General
 * baseline + a few high-frequency type-specific items. Attorney tailors per case.
 */
export function immigrationEvidenceChecklist(matterKey?: string): string[] {
  const base = [
    "Valid passport(s) — biographic page",
    "Any prior USCIS/EOIR notices, receipts, or decisions",
    "I-94 arrival/departure record (if applicable)",
    "Current immigration status documents (visa, EAD, green card)",
    "Government-issued photo ID",
    "Two passport-style photographs",
  ];
  const byType: Record<string, string[]> = {
    family_petition: ["Marriage/birth certificates proving the qualifying relationship", "Proof of the petitioner's U.S. status/citizenship", "Evidence of a bona fide relationship (photos, joint accounts, lease)"],
    adjustment: ["Form I-693 medical exam (sealed)", "Birth certificate with certified translation", "Proof of lawful entry / I-94"],
    naturalization: ["Green card (front and back)", "Travel history for the past 5 years", "Tax transcripts and any selective-service registration"],
    asylum: ["Personal declaration of persecution", "Country-condition evidence", "Corroborating documents (police/medical reports, witness letters)"],
    removal_defense: ["Notice to Appear (NTA)", "All prior court/USCIS filings", "Evidence supporting relief (hardship, ties, rehabilitation)"],
    u_visa: ["Form I-918 Supplement B certification from law enforcement", "Evidence of the qualifying crime and harm suffered"],
    naturalization_derivative: [],
  };
  return matterKey && byType[matterKey] ? [...base, ...byType[matterKey]] : base;
}

/** Scope/context injected into engagement letters for immigration matters. */
export function immigrationEngagementScope(matterKey?: string): string {
  const t = matterKey ? IMMIGRATION_MATTER_TYPES.find((x) => x.key === matterKey) : undefined;
  const formLine = t ? `The representation covers preparation and filing of Form ${t.form} (${t.label}) with ${t.agency}.` : "The representation covers the immigration matter described.";
  return [
    formLine,
    "Scope is limited to this filing and directly related USCIS/EOIR correspondence; it does not include appeals, motions, or separate applications unless added in writing.",
    "The client is responsible for providing complete, truthful information and the supporting evidence listed, and for attending any biometrics appointments, interviews, or hearings.",
    "Government filing fees are the client's responsibility and are separate from attorney fees. Processing times are set by the government and are outside the firm's control.",
  ].join(" ");
}
