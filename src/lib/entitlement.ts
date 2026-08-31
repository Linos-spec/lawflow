import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api/response";

/**
 * Billing entitlement — is a firm allowed to use the paid product right now?
 *
 * Entitled when: an active/trialing/past_due Stripe subscription (past_due keeps
 * a short grace while Stripe retries), OR still inside the 14-day trial, OR the
 * firm is "grandfathered" (created before billing existed — no trial date and no
 * subscription). Locked only when a real trial has lapsed with no active plan, or
 * the subscription was canceled/unpaid. Grandfathering protects existing/demo
 * firms; new signups (which get a trialEndsAt) hit the paywall when the trial ends.
 */
const ACTIVE = ["active", "trialing", "past_due"];

export interface Entitlement { entitled: boolean; status: string; locked: boolean; }

export function computeEntitlement(firm: {
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
}): Entitlement {
  const now = Date.now();
  const hasActiveSub = !!firm.subscriptionStatus && ACTIVE.includes(firm.subscriptionStatus);
  const inTrial = !!firm.trialEndsAt && firm.trialEndsAt.getTime() > now;
  const grandfathered = !firm.trialEndsAt && !firm.subscriptionStatus;

  const entitled = hasActiveSub || inTrial || grandfathered;
  const status = firm.subscriptionStatus
    || (inTrial ? "trialing" : (firm.trialEndsAt ? "trial_expired" : "none"));
  return { entitled, status, locked: !entitled };
}

export async function firmEntitlement(firmId: string): Promise<Entitlement> {
  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
    select: { trialEndsAt: true, subscriptionStatus: true },
  });
  if (!firm) return { entitled: false, status: "none", locked: true };
  return computeEntitlement(firm);
}

/**
 * Server-side gate for money/value actions. Returns a 402 Response to send back
 * when the firm is locked, or null when it may proceed. Use at the top of a route:
 *   const blocked = await entitledOr402(ctx.firmId); if (blocked) return blocked;
 */
export async function entitledOr402(firmId: string): Promise<Response | null> {
  const e = await firmEntitlement(firmId);
  if (e.locked) {
    return errorResponse("Your subscription is inactive. Ask your firm admin to subscribe in Settings → Plan & Billing.", 402);
  }
  return null;
}
