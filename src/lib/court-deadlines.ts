/**
 * Court-deadline calculation — the safety system.
 *
 * Deterministic (never AI): computes deadlines from a trigger date and a rule,
 * skipping weekends and U.S. federal court holidays, and rolling a due date that
 * lands on a closure to the next business day.
 *
 * Jurisdiction rules genuinely vary and a wrong date is malpractice — every
 * result is a computation AID the attorney MUST verify against current local
 * rules. The engine is exact about the math; it does not warrant the rule.
 */

// All date math is done in UTC so results never depend on the server's or
// client's timezone — a court deadline must be the same calendar date everywhere.
function pad(n: number) { return String(n).padStart(2, "0"); }
export function toISODate(d: Date): string { return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  // month 0-based; weekday 0=Sun..6=Sat; n=1..5
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (7 + weekday - first.getUTCDay()) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7));
}
function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, month + 1, 0));
  const offset = (7 + last.getUTCDay() - weekday) % 7;
  return new Date(Date.UTC(year, month, last.getUTCDate() - offset));
}
function observed(d: Date): Date {
  // Federal holidays on Sat are observed Fri; on Sun observed Mon.
  if (d.getUTCDay() === 6) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 1));
  if (d.getUTCDay() === 0) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return d;
}

/** Observed U.S. federal holidays for a year, as a Set of ISO dates. */
export function usFederalHolidays(year: number): Set<string> {
  const fixed = [
    new Date(Date.UTC(year, 0, 1)),   // New Year's Day
    new Date(Date.UTC(year, 5, 19)),  // Juneteenth
    new Date(Date.UTC(year, 6, 4)),   // Independence Day
    new Date(Date.UTC(year, 10, 11)), // Veterans Day
    new Date(Date.UTC(year, 11, 25)), // Christmas
  ].map(observed);
  const floating = [
    nthWeekday(year, 0, 1, 3),   // MLK — 3rd Mon Jan
    nthWeekday(year, 1, 1, 3),   // Presidents — 3rd Mon Feb
    lastWeekday(year, 4, 1),     // Memorial — last Mon May
    nthWeekday(year, 8, 1, 1),   // Labor — 1st Mon Sep
    nthWeekday(year, 9, 1, 2),   // Columbus/Indigenous — 2nd Mon Oct
    nthWeekday(year, 10, 4, 4),  // Thanksgiving — 4th Thu Nov
  ];
  return new Set([...fixed, ...floating].map(toISODate));
}

export function isCourtHoliday(d: Date): boolean {
  return usFederalHolidays(d.getUTCFullYear()).has(toISODate(d));
}
export function isBusinessDay(d: Date): boolean {
  return d.getUTCDay() !== 0 && d.getUTCDay() !== 6 && !isCourtHoliday(d);
}

/** Roll a date forward to the next business day if it falls on a weekend/holiday. */
export function rollToBusinessDay(d: Date): Date {
  const out = new Date(d);
  while (!isBusinessDay(out)) out.setUTCDate(out.getUTCDate() + 1);
  return out;
}
export function addCalendarDays(d: Date, n: number): Date {
  const out = new Date(d); out.setUTCDate(out.getUTCDate() + n); return out;
}
export function addBusinessDays(d: Date, n: number): Date {
  const out = new Date(d);
  let added = 0;
  while (added < n) { out.setUTCDate(out.getUTCDate() + 1); if (isBusinessDay(out)) added++; }
  return out;
}

export type DeadlineRule = {
  key: string;
  label: string;
  days: number;
  basis: "calendar" | "business";
  jurisdiction: string;
  note?: string;
};

/** Curated common rules. NOT authoritative — attorney verifies against local rules. */
export const DEADLINE_RULES: DeadlineRule[] = [
  { key: "frcp_answer", label: "Answer to complaint (FRCP 12)", days: 21, basis: "calendar", jurisdiction: "US Federal" },
  { key: "frcp_answer_waiver", label: "Answer after waiver of service", days: 60, basis: "calendar", jurisdiction: "US Federal" },
  { key: "frcp_motion_response", label: "Response to a motion (varies by court)", days: 14, basis: "calendar", jurisdiction: "US Federal", note: "Local rules often govern — verify." },
  { key: "frcp_reply", label: "Reply brief", days: 7, basis: "calendar", jurisdiction: "US Federal" },
  { key: "appeal_notice", label: "Notice of appeal (civil, US)", days: 30, basis: "calendar", jurisdiction: "US Federal" },
  { key: "discovery_response", label: "Discovery responses", days: 30, basis: "calendar", jurisdiction: "US Federal" },
  // Immigration (beachhead)
  { key: "uscis_rfe", label: "USCIS RFE response (typical max)", days: 87, basis: "calendar", jurisdiction: "USCIS", note: "Use the deadline printed on the RFE — this is the common maximum." },
  { key: "uscis_noid", label: "USCIS NOID response", days: 30, basis: "calendar", jurisdiction: "USCIS" },
  { key: "bia_appeal", label: "Appeal to BIA (EOIR-26)", days: 30, basis: "calendar", jurisdiction: "EOIR" },
  { key: "motion_reopen", label: "Motion to reopen (removal)", days: 90, basis: "calendar", jurisdiction: "EOIR" },
];

export function ruleByKey(key: string): DeadlineRule | undefined {
  return DEADLINE_RULES.find((r) => r.key === key);
}

/** Compute a deadline from a trigger date + rule (or ad-hoc days/basis). */
export function computeCourtDeadline(input: {
  triggerDate: Date;
  ruleKey?: string;
  days?: number;
  basis?: "calendar" | "business";
}): { dueDate: string; landedOnClosure: boolean; rule?: DeadlineRule } {
  const rule = input.ruleKey ? ruleByKey(input.ruleKey) : undefined;
  const days = rule?.days ?? input.days ?? 0;
  const basis = rule?.basis ?? input.basis ?? "calendar";

  const raw = basis === "business" ? addBusinessDays(input.triggerDate, days) : addCalendarDays(input.triggerDate, days);
  const rolled = rollToBusinessDay(raw);
  return {
    dueDate: toISODate(rolled),
    landedOnClosure: toISODate(rolled) !== toISODate(raw),
    rule,
  };
}
