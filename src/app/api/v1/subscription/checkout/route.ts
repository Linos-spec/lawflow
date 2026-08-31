import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { stripe, stripeConfigured, ensureCustomer, seatCount, SEAT_PRICE_ID } from "@/lib/stripe";

export const runtime = "nodejs";

/** Start a Stripe Checkout for the per-seat subscription (quantity = seats). Admin only. */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return errorResponse("Only an admin can manage billing.", 403);
  if (!stripeConfigured()) return successResponse({ notConfigured: true }); // 200 flag, not 5xx

  const customer = await ensureCustomer(ctx.firmId);
  const seats = await seatCount(ctx.firmId);
  const origin = publicBaseUrl(req);

  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { trialEndsAt: true } });
  const trialEnd = firm?.trialEndsAt && firm.trialEndsAt.getTime() > Date.now()
    ? Math.floor(firm.trialEndsAt.getTime() / 1000)
    : undefined;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: SEAT_PRICE_ID, quantity: Math.max(1, seats) }],
      subscription_data: {
        metadata: { firmId: ctx.firmId },
        ...(trialEnd ? { trial_end: trialEnd } : {}),
      },
      success_url: `${origin}/settings?billing=success`,
      cancel_url: `${origin}/settings?billing=cancel`,
      allow_promotion_codes: true,
    });
    return successResponse({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return successResponse({ error: "Could not start checkout. Please try again.", detail: String(err instanceof Error ? err.message : err).slice(0, 200) });
  }
}
