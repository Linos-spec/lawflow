import { NextRequest } from "next/server";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { DEADLINE_RULES, computeCourtDeadline } from "@/lib/court-deadlines";
import { z } from "zod";

export const runtime = "nodejs";

/** List the available court-deadline rules. */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  return successResponse({ rules: DEADLINE_RULES });
}

const schema = z.object({
  triggerDate: z.coerce.date(),
  ruleKey: z.string().optional(),
  days: z.coerce.number().int().optional(),
  basis: z.enum(["calendar", "business"]).optional(),
});

/** Compute a court deadline from a trigger date + rule (skips weekends/holidays). */
export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return errorResponse("Provide a trigger date and a rule (or days).", 400);
  }
  if (!input.ruleKey && input.days == null) {
    return errorResponse("Choose a rule or enter a number of days.", 400);
  }

  const result = computeCourtDeadline({
    triggerDate: input.triggerDate,
    ruleKey: input.ruleKey,
    days: input.days,
    basis: input.basis,
  });
  return successResponse({
    ...result,
    disclaimer: "Computed by skipping weekends and U.S. federal court holidays. Jurisdiction rules vary — verify against current local rules before relying on this date.",
  });
}
