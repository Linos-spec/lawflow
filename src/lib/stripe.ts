import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * Stripe per-seat billing. One subscription per firm; quantity = number of firm
 * users (seats). Configured entirely by env vars so the app runs without it:
 *   STRIPE_SECRET_KEY     — sk_live_… / sk_test_…
 *   STRIPE_PRICE_ID       — the recurring $29/seat/mo Price
 *   STRIPE_WEBHOOK_SECRET — whsec_… for the webhook route
 */

// Trim so an accidentally pasted space/newline/quote doesn't silently disable billing.
const clean = (v?: string) => (v || "").trim().replace(/^["']|["']$/g, "");

export const SEAT_PRICE_ID = clean(process.env.STRIPE_PRICE_ID);
export const SEAT_PRICE_USD = 29;

export function stripeConfigured(): boolean {
  const k = clean(process.env.STRIPE_SECRET_KEY);
  // Accept standard secret keys (sk_) and restricted keys (rk_); reject pk_ (publishable).
  return (k.startsWith("sk_") || k.startsWith("rk_")) && SEAT_PRICE_ID.startsWith("price_");
}

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(clean(process.env.STRIPE_SECRET_KEY));
  return _stripe;
}

/** Count current seats (firm users). */
export async function seatCount(firmId: string): Promise<number> {
  return prisma.user.count({ where: { firmId } });
}

/** Ensure the firm has a Stripe customer; returns the customer id. */
export async function ensureCustomer(firmId: string): Promise<string> {
  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
    select: { stripeCustomerId: true, name: true, email: true },
  });
  if (!firm) throw new Error("Firm not found");
  if (firm.stripeCustomerId) return firm.stripeCustomerId;

  const customer = await stripe().customers.create({
    name: firm.name,
    email: firm.email || undefined,
    metadata: { firmId },
  });
  await prisma.firm.update({ where: { id: firmId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

/**
 * Keep the Stripe subscription quantity in step with the seat count. Safe no-op
 * when billing isn't configured or the firm has no active subscription yet.
 */
export async function syncSeatQuantity(firmId: string): Promise<void> {
  if (!stripeConfigured()) return;
  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
    select: { stripeSubscriptionId: true, subscriptionStatus: true },
  });
  if (!firm?.stripeSubscriptionId) return;
  if (firm.subscriptionStatus && ["canceled", "incomplete_expired"].includes(firm.subscriptionStatus)) return;

  try {
    const seats = await seatCount(firmId);
    const sub = await stripe().subscriptions.retrieve(firm.stripeSubscriptionId);
    const item = sub.items.data[0];
    if (!item) return;
    if (item.quantity !== seats) {
      await stripe().subscriptions.update(firm.stripeSubscriptionId, {
        items: [{ id: item.id, quantity: seats }],
        proration_behavior: "create_prorations",
      });
    }
    await prisma.firm.update({ where: { id: firmId }, data: { subscribedSeats: seats } });
  } catch (e) {
    console.error("syncSeatQuantity failed:", e);
  }
}
