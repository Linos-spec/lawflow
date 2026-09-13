import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Calendly integration (v2 API). A firm connects with a Personal Access Token;
 * we register a webhook subscription so booked events flow back as in-app
 * CLIENT_MEETING deadlines. No OAuth app registration required.
 *
 * Docs: https://developer.calendly.com/api-docs
 */

const API = "https://api.calendly.com";

async function calendlyGet(token: string, path: string) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Calendly ${path} → ${res.status}`);
  return res.json();
}

export interface CalendlyMe {
  uri: string;            // user URI
  organization: string;   // current organization URI
  name: string;
  schedulingUrl: string;  // their public booking page
}

/** Fetch the authenticated user's URIs (validates the token). */
export async function calendlyMe(token: string): Promise<CalendlyMe> {
  const j = await calendlyGet(token, "/users/me");
  const r = j.resource;
  return { uri: r.uri, organization: r.current_organization, name: r.name || "Calendly account", schedulingUrl: r.scheduling_url || "" };
}

/** Create a user-scoped webhook subscription for invitee.created/canceled. */
async function createWebhook(token: string, opts: { url: string; org: string; user: string; signingKey: string }): Promise<string> {
  const res = await fetch(`${API}/webhook_subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: opts.url,
      events: ["invitee.created", "invitee.canceled"],
      organization: opts.org,
      user: opts.user,
      scope: "user",
      signing_key: opts.signingKey,
    }),
  });
  if (!res.ok) throw new Error(`Calendly webhook create → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  return j.resource.uri as string;
}

/** Best-effort delete of a webhook subscription (uuid is the last path segment). */
async function deleteWebhook(token: string, webhookUri: string): Promise<void> {
  const uuid = webhookUri.split("/").pop();
  if (!uuid) return;
  await fetch(`${API}/webhook_subscriptions/${uuid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

/**
 * Connect a firm's Calendly account: validate the token, register the webhook,
 * and persist the connection. Returns the connected account's display info.
 */
export async function connectCalendly(firmId: string, token: string, callbackBase: string): Promise<{ name: string; schedulingUrl: string }> {
  const me = await calendlyMe(token);

  // Clean up any prior subscription so we don't leak duplicates.
  const existing = await prisma.firm.findUnique({ where: { id: firmId }, select: { calendlyToken: true, calendlyWebhookUri: true, calendlyUrl: true } });
  if (existing?.calendlyToken && existing.calendlyWebhookUri) {
    await deleteWebhook(existing.calendlyToken, existing.calendlyWebhookUri);
  }

  const signingKey = crypto.randomBytes(24).toString("hex");
  const url = `${callbackBase.replace(/\/$/, "")}/api/webhooks/calendly/${firmId}`;
  const webhookUri = await createWebhook(token, { url, org: me.organization, user: me.uri, signingKey });

  // If the firm hasn't set a public booking link yet, adopt their Calendly one.
  const adoptBookingUrl = !existing?.calendlyUrl && me.schedulingUrl ? me.schedulingUrl : undefined;

  await prisma.firm.update({
    where: { id: firmId },
    data: {
      calendlyToken: token,
      calendlyUserUri: me.uri,
      calendlyOrgUri: me.organization,
      calendlyName: me.name,
      calendlyWebhookUri: webhookUri,
      calendlySigningKey: signingKey,
      ...(adoptBookingUrl ? { calendlyUrl: adoptBookingUrl } : {}),
    },
  });

  return { name: me.name, schedulingUrl: me.schedulingUrl };
}

/** Disconnect: remove the webhook and clear stored credentials. */
export async function disconnectCalendly(firmId: string): Promise<void> {
  const firm = await prisma.firm.findUnique({ where: { id: firmId }, select: { calendlyToken: true, calendlyWebhookUri: true } });
  if (firm?.calendlyToken && firm.calendlyWebhookUri) {
    await deleteWebhook(firm.calendlyToken, firm.calendlyWebhookUri);
  }
  await prisma.firm.update({
    where: { id: firmId },
    data: { calendlyToken: null, calendlyUserUri: null, calendlyOrgUri: null, calendlyName: null, calendlyWebhookUri: null, calendlySigningKey: null },
  });
}

/**
 * Verify a Calendly webhook signature header:
 *   Calendly-Webhook-Signature: t=<unix>,v1=<hex hmac>
 * Signed payload is `${t}.${rawBody}`, HMAC-SHA256 with the subscription's key.
 */
export function verifyCalendlySignature(header: string | null, rawBody: string, signingKey: string): boolean {
  if (!header || !signingKey) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=").map((s) => s.trim())));
  const t = parts["t"], v1 = parts["v1"];
  if (!t || !v1) return false;
  const expected = crypto.createHmac("sha256", signingKey).update(`${t}.${rawBody}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
