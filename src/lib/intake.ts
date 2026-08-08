/**
 * Intake status model — a simple, human-reviewable progression with an audit
 * trail. Pure/client-safe: labels, colors, ordering, and allowed transitions
 * only (no Prisma). Server writes audit events in the API routes.
 */

export type IntakeStatus =
  | "NEW"
  | "AI_PROCESSING"
  | "NEEDS_REVIEW"
  | "FOLLOW_UP"
  | "QUALIFIED"
  | "CONVERTED"
  | "DECLINED"
  | "ARCHIVED";

/** The linear happy-path progression (terminal states excluded). */
export const INTAKE_FLOW: IntakeStatus[] = [
  "NEW", "AI_PROCESSING", "NEEDS_REVIEW", "FOLLOW_UP", "QUALIFIED", "CONVERTED",
];

export const INTAKE_TERMINAL: IntakeStatus[] = ["DECLINED", "ARCHIVED"];

/** All statuses, in display order. */
export const INTAKE_STATUSES: IntakeStatus[] = [...INTAKE_FLOW, ...INTAKE_TERMINAL];

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  NEW: "New",
  AI_PROCESSING: "AI processing",
  NEEDS_REVIEW: "Needs review",
  FOLLOW_UP: "Follow-up",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  DECLINED: "Declined",
  ARCHIVED: "Archived",
};

/** Badge colors (bg/text), aligned with the app's token palette. */
export const INTAKE_STATUS_COLORS: Record<IntakeStatus, { bg: string; text: string }> = {
  NEW:           { bg: "#dbeafe", text: "#1e40af" }, // blue
  AI_PROCESSING: { bg: "#ede9fe", text: "#6d28d9" }, // violet
  NEEDS_REVIEW:  { bg: "#fef3c7", text: "#b45309" }, // amber
  FOLLOW_UP:     { bg: "#ffedd5", text: "#c2410c" }, // orange
  QUALIFIED:     { bg: "#dcfce7", text: "#15803d" }, // green
  CONVERTED:     { bg: "#d1fae5", text: "#065f46" }, // emerald
  DECLINED:      { bg: "#fee2e2", text: "#b91c1c" }, // red
  ARCHIVED:      { bg: "#f1f5f9", text: "#475569" }, // slate
};

/**
 * Allowed manual transitions from a given status. Keeps the queue honest while
 * allowing reopen/unarchive. AI_PROCESSING is normally set by the system, but a
 * reviewer may re-run it from NEW.
 */
export const INTAKE_TRANSITIONS: Record<IntakeStatus, IntakeStatus[]> = {
  NEW:           ["AI_PROCESSING", "NEEDS_REVIEW", "DECLINED", "ARCHIVED"],
  AI_PROCESSING: ["NEEDS_REVIEW", "DECLINED", "ARCHIVED"],
  NEEDS_REVIEW:  ["FOLLOW_UP", "QUALIFIED", "DECLINED", "ARCHIVED"],
  FOLLOW_UP:     ["NEEDS_REVIEW", "QUALIFIED", "DECLINED", "ARCHIVED"],
  QUALIFIED:     ["CONVERTED", "FOLLOW_UP", "DECLINED", "ARCHIVED"],
  CONVERTED:     ["ARCHIVED"],
  DECLINED:      ["NEEDS_REVIEW", "ARCHIVED"],
  ARCHIVED:      ["NEEDS_REVIEW"],
};

export function intakeStatusLabel(s?: string | null): string {
  return (s && INTAKE_STATUS_LABELS[s as IntakeStatus]) || s || "—";
}
