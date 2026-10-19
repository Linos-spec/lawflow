/**
 * "Solutions" taxonomy for the marketing mega-menu + /solutions page.
 * Our flow (deliberately NOT a copy of the competitor's static landing pages):
 * every item routes into the gated request-access funnel with `?for=<slug>`,
 * so the intake is personalized to the visitor's practice / firm size / role.
 */

export interface Segment { slug: string; label: string; blurb: string }

// Immigration-forward, curated to the firms we serve (small & solo).
export const PRACTICE_AREAS: Segment[] = [
  { slug: "immigration", label: "Immigration", blurb: "24/7 multilingual intake, conflict checks, and AI qualification built for high-volume immigration work." },
  { slug: "family", label: "Family law", blurb: "Sensitive intake, deadline tracking, and a client portal that keeps emotional matters organized." },
  { slug: "employment", label: "Employment", blurb: "Screen claims fast with AI qualification and clean conflict checks against employers." },
  { slug: "estate-planning", label: "Estate planning", blurb: "Templated engagement letters and document generation for wills, trusts, and probate." },
  { slug: "criminal", label: "Criminal defense", blurb: "Rapid intake and court-date tracking so nothing slips while you're in court." },
  { slug: "personal-injury", label: "Personal injury", blurb: "Lead scoring and source tracking to focus on the cases worth taking." },
  { slug: "business", label: "Business & compliance", blurb: "Entity formation, agreements, and matter workflows with full activity history." },
  { slug: "real-estate", label: "Real estate", blurb: "Transaction checklists, documents, and secure client document exchange." },
  { slug: "bankruptcy", label: "Bankruptcy", blurb: "Structured intake and document collection to move filings along." },
  { slug: "civil-litigation", label: "Civil litigation", blurb: "Matters, parties, deadlines, and e-filing with proof of delivery." },
];

export const FIRM_SIZES: Segment[] = [
  { slug: "solo", label: "Solo practice", blurb: "Run intake, matters, and billing yourself — the AI handles the busywork." },
  { slug: "small-firm", label: "Small firm", blurb: "A few attorneys and staff, one shared client & matter record, no duplicate entry." },
  { slug: "growing-firm", label: "Growing firm", blurb: "Add seats, assign owners, and track the pipeline as you scale." },
];

export const ROLES: Segment[] = [
  { slug: "attorney", label: "Attorneys & partners", blurb: "Qualified leads, matter intelligence, and AI drafts you review — never auto-sent." },
  { slug: "paralegal", label: "Paralegals", blurb: "Intake, document collection, tasks, and deadlines in one place." },
  { slug: "office-manager", label: "Office managers", blurb: "Team, billing, and the client portal under one admin." },
  { slug: "billing-intake", label: "Billing & intake staff", blurb: "Capture every lead and every billable hour, invoice without re-keying." },
];

const BY_SLUG: Record<string, string> = Object.fromEntries(
  [...PRACTICE_AREAS, ...FIRM_SIZES, ...ROLES].map((s) => [s.slug, s.label])
);

/** Human label for a `?for=` slug, or null if unknown. */
export function solutionLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return BY_SLUG[slug] ?? null;
}
