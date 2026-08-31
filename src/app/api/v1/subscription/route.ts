import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";
import { stripeConfigured, seatCount, SEAT_PRICE_USD } from "@/lib/stripe";

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
  const status = firm?.subscriptionStatus
    || (trialEnds && trialEnds > now ? "trialing" : (trialEnds ? "trial_expired" : "none"));

  return successResponse({
    configured: stripeConfigured(),
    status,                                   // trialing | trial_expired | active | past_due | canceled | none
    hasSubscription: !!firm?.stripeSubscriptionId,
    trialEndsAt: firm?.trialEndsAt ? firm.trialEndsAt.toISOString() : null,
    trialDaysLeft,
    seats,
    pricePerSeat: SEAT_PRICE_USD,
    monthlyTotal: seats * SEAT_PRICE_USD,
    isAdmin: ctx.role === "ADMIN",
  });
}
