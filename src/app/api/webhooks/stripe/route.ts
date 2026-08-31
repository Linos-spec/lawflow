import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook — keeps the firm's subscription status in sync. Public (Stripe
 * calls it) but signature-verified with STRIPE_WEBHOOK_SECRET. Uses the raw body.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return new Response("Webhook not configured", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return new Response(`Invalid signature: ${err instanceof Error ? err.message : ""}`, { status: 400 });
  }

  const setFromSubscription = async (sub: Stripe.Subscription) => {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const firm = await prisma.firm.findFirst({
      where: { OR: [{ stripeCustomerId: customerId }, { id: sub.metadata?.firmId || "" }] },
      select: { id: true },
    });
    if (!firm) return;
    await prisma.firm.update({
      where: { id: firm.id },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        subscriptionStatus: sub.status,
        subscribedSeats: sub.items.data[0]?.quantity ?? null,
      },
    });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe().subscriptions.retrieve(
            typeof session.subscription === "string" ? session.subscription : session.subscription.id
          );
          await setFromSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await setFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
