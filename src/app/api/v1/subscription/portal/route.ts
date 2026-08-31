import { NextRequest } from "next/server";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { stripe, stripeConfigured, ensureCustomer } from "@/lib/stripe";

export const runtime = "nodejs";

/** Open the Stripe Billing Portal (manage card, invoices, cancel). Admin only. */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return errorResponse("Only an admin can manage billing.", 403);
  if (!stripeConfigured()) return successResponse({ notConfigured: true });

  const customer = await ensureCustomer(ctx.firmId);
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${publicBaseUrl(req)}/settings`,
    });
    return successResponse({ url: session.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    return successResponse({ error: "Could not open the billing portal. Please try again.", detail: String(err instanceof Error ? err.message : err).slice(0, 200) });
  }
}
