import { z } from "zod";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas/catalog";

const optStr = z.string().optional();
const optDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional()
);
const optNum = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().optional()
);

export const createCaseSchema = z.object({
  title: z.string().min(1, "Matter name is required"),
  clientId: z.string().min(1, "Client is required"),
  caseType: z.enum(PRACTICE_AREA_KEYS).default("CIVIL"),
  status: z.enum([
    "OPEN", "ACTIVE", "ON_HOLD", "PENDING", "CLOSED", "ARCHIVED",
  ]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  description: optStr,
  notes: optStr,

  // ── Matter details ──
  practiceArea: optStr,
  matterSubtype: optStr,
  jurisdiction: optStr,
  venue: optStr,
  courtName: optStr,          // court or agency
  judgeName: optStr,
  docketNumber: optStr,
  opposingParties: z.array(z.string()).optional(),
  opposingCounsel: optStr,
  claimValue: optNum,
  matterStage: optStr,
  nextAction: optStr,
  statuteOfLimitations: optDate,
  filingDate: optDate,
  openedDate: optDate,
  closingDate: optDate,
  responsibleAttorneyId: optStr,
  assignedTeamIds: z.array(z.string()).optional(),
});

export const updateCaseSchema = createCaseSchema.partial();

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

/** Convert "" → null so optional matter columns store NULL. */
export function normalizeCaseInput<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) out[k] = v === "" ? null : v;
  return out as T;
}
