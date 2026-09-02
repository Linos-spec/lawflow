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
// Base Stripe price is the REGULAR $49; new firms get a 6-month intro discount
// (a repeating coupon) that Stripe removes automatically → $29 for 6 months, then $49.
export const SEAT_PRICE_USD = 49;         // regular
export const SEAT_INTRO_USD = 29;         // introductory (first 6 months)
export const INTRO_MONTHS = 6;
export const INTRO_COUPON_ID = "linoscore-intro-6mo";
// Percent off $49 that yields $29 (Stripe rounds the per-line discount to cents).
const INTRO_PERCENT_OFF = Number((((SEAT_PRICE_USD - SEAT_INTRO_USD) / SEAT_PRICE_USD) * 100).toFixed(4)); // 40.8163

export function stripeConfigured(): boolean {
  const k = clean(process.env.STRIPE_SECRET_KEY);
  // Accept standard secret keys (sk_) and restricted keys (rk_); reject pk_ (publishable).
  return (k.startsWith("sk_") || k.startsWith("rk_")) && SEAT_PRICE_ID.startsWith("price_");
}

/**
 * Ensure the 6-month introductory coupon exists, and return its id. Idempotent —
 * created once with a fixed id, reused thereafter. Applied at checkout so new
 * firms pay $29/seat for 6 months, then Stripe automatically bills the full $49.
 */
export async function ensureIntroCoupon(): Promise<string> {
  try {
    await stripe().coupons.retrieve(INTRO_COUPON_ID);
  } catch {
    await stripe().coupons.create({
      id: INTRO_COUPON_ID,
      name: "New-firm intro (6 months)",
      percent_off: INTRO_PERCENT_OFF,
      duration: "repeating",
      duration_in_months: INTRO_MONTHS,
    }).catch(() => {});
  }
  return INTRO_COUPON_ID;
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
