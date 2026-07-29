/**
 * Canonical practice-area (matter type) catalog — the single source of truth.
 *
 * Every picker, label map, filter, and AI classification enum derives from this
 * list so the app never drifts. Keys are stable identifiers stored on records
 * (Case.caseType, Lead.caseType, Case.practiceArea); labels are display-only and
 * may be re-worded without a data migration.
 *
 * Immigration is the depth beachhead (see ./immigration.ts). The rest are full
 * first-class taxonomy — selectable and reportable everywhere — with lighter
 * built-in intelligence for now.
 */

export type PracticeAreaGroup =
  | "Litigation & Disputes"
  | "Family & Personal"
  | "Business & Property"
  | "Other";

/**
 * Non-empty tuple of keys, literal-typed. Order matters for pickers. This tuple
 * MUST stay in sync with the Prisma `CaseType` enum — the literal union it yields
 * is what makes zod-validated values assignable to Prisma's generated CaseType.
 */
export const PRACTICE_AREA_KEYS = [
  "CIVIL", "PERSONAL_INJURY", "EMPLOYMENT", "WORKERS_COMP", "CIVIL_RIGHTS",
  "IMMIGRATION", "FAMILY", "CRIMINAL", "ESTATE_PLANNING", "ELDER_LAW", "SOCIAL_SECURITY",
  "CORPORATE", "REAL_ESTATE", "LANDLORD_TENANT", "INTELLECTUAL_PROPERTY", "TAX", "BANKRUPTCY",
  "OTHER",
] as const;

export type PracticeAreaKey = (typeof PRACTICE_AREA_KEYS)[number];

export type PracticeArea = {
  key: PracticeAreaKey;
  label: string;
  group: PracticeAreaGroup;
  /** true when the app ships vertical-specific depth (checklists, workflows, rules). */
  deep?: boolean;
};

export const PRACTICE_AREAS: PracticeArea[] = [
  // ── Litigation & Disputes ──
  { key: "CIVIL", label: "Civil Litigation", group: "Litigation & Disputes" },
  { key: "PERSONAL_INJURY", label: "Personal Injury", group: "Litigation & Disputes" },
  { key: "EMPLOYMENT", label: "Employment & Labor", group: "Litigation & Disputes" },
  { key: "WORKERS_COMP", label: "Workers' Compensation", group: "Litigation & Disputes" },
  { key: "CIVIL_RIGHTS", label: "Civil Rights", group: "Litigation & Disputes" },

  // ── Family & Personal ──
  { key: "IMMIGRATION", label: "Immigration", group: "Family & Personal", deep: true },
  { key: "FAMILY", label: "Family Law", group: "Family & Personal" },
  { key: "CRIMINAL", label: "Criminal Defense", group: "Family & Personal" },
  { key: "ESTATE_PLANNING", label: "Estate Planning & Probate", group: "Family & Personal" },
  { key: "ELDER_LAW", label: "Elder Law", group: "Family & Personal" },
  { key: "SOCIAL_SECURITY", label: "Social Security Disability", group: "Family & Personal" },

  // ── Business & Property ──
  { key: "CORPORATE", label: "Business & Corporate", group: "Business & Property" },
  { key: "REAL_ESTATE", label: "Real Estate", group: "Business & Property" },
  { key: "LANDLORD_TENANT", label: "Landlord–Tenant", group: "Business & Property" },
  { key: "INTELLECTUAL_PROPERTY", label: "Intellectual Property", group: "Business & Property" },
  { key: "TAX", label: "Tax", group: "Business & Property" },
  { key: "BANKRUPTCY", label: "Bankruptcy", group: "Business & Property" },

  // ── Other ──
  { key: "OTHER", label: "Other", group: "Other" },
];

/** key → label map. */
export const PRACTICE_AREA_LABELS: Record<string, string> = Object.fromEntries(
  PRACTICE_AREAS.map((p) => [p.key, p.label]),
);

/** { value, label } list for <select>/card pickers, in catalog order. */
export const PRACTICE_AREA_OPTIONS = PRACTICE_AREAS.map((p) => ({ value: p.key, label: p.label }));

/** Catalog grouped by section, for grouped pickers. */
export const PRACTICE_AREAS_BY_GROUP: { group: PracticeAreaGroup; areas: PracticeArea[] }[] = (() => {
  const order: PracticeAreaGroup[] = [
    "Litigation & Disputes",
    "Family & Personal",
    "Business & Property",
    "Other",
  ];
  return order.map((group) => ({ group, areas: PRACTICE_AREAS.filter((p) => p.group === group) }));
})();

export function practiceAreaLabel(key?: string | null): string {
  if (!key) return "—";
  return PRACTICE_AREA_LABELS[key] || key;
}
