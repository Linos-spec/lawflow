import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";
import { stripeConfigured, seatCount, SEAT_PRICE_USD, SEAT_INTRO_USD, INTRO_MONTHS } from "@/lib/stripe";
import { computeEntitlement } from "@/lib/entitlement";

export const runtime = "nodejs";

/** Current billing state for the firm — trial, subscription status, seats, total. */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const firm = await prisma.firm.findUnique({
    where: { id: ctx.firmId },
    select: { trialEndsAt: true, subscriptionStatus: true, stripeSubscriptionId: true },
  });
  const seats = await seatCount(ctx.firmId);

  const now = Date.now();
  const trialEnds = firm?.trialEndsAt ? firm.trialEndsAt.getTime() : null;
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - now) / 86_400_000)) : null;
  const ent = computeEntitlement({ trialEndsAt: firm?.trialEndsAt ?? null, subscriptionStatus: firm?.subscriptionStatus ?? null });

  return successResponse({
    configured: stripeConfigured(),
    status: ent.status,                       // trialing | trial_expired | active | past_due | canceled | none
    locked: ent.locked,                       // true → access blocked until they subscribe
    hasSubscription: !!firm?.stripeSubscriptionId,
    trialEndsAt: firm?.trialEndsAt ? firm.trialEndsAt.toISOString() : null,
    trialDaysLeft,
    seats,
    pricePerSeat: SEAT_INTRO_USD,              // what a new firm pays now (intro)
    regularPricePerSeat: SEAT_PRICE_USD,        // after the intro period
    introMonths: INTRO_MONTHS,
    monthlyTotal: seats * SEAT_INTRO_USD,
    isAdmin: ctx.role === "ADMIN",
  });
}
