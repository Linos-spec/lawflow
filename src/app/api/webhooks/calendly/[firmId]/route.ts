import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCalendlySignature } from "@/lib/calendly";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Calendly webhook — one subscription per firm (firmId in the path). When a
 * client books (invitee.created) we create an in-app CLIENT_MEETING deadline;
 * when they cancel (invitee.canceled) we remove it. Public but HMAC-verified
 * with the firm's stored signing key. Always returns 200 on handled events so
 * Calendly doesn't retry endlessly; auth failures return 401.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  const { firmId } = await params;

  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
    select: { id: true, calendlySigningKey: true },
  });
  if (!firm?.calendlySigningKey) return new Response("Not configured", { status: 404 });

  const raw = await req.text();
  if (!verifyCalendlySignature(req.headers.get("calendly-webhook-signature"), raw, firm.calendlySigningKey)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let evt: { event?: string; payload?: CalendlyInviteePayload };
  try { evt = JSON.parse(raw); } catch { return new Response("Bad payload", { status: 400 }); }

  try {
    if (evt.event === "invitee.created" && evt.payload) {
      await handleCreated(firmId, evt.payload);
    } else if (evt.event === "invitee.canceled" && evt.payload) {
      await handleCanceled(firmId, evt.payload);
    }
  } catch (err) {
    // Log and still 200 — a thrown error would make Calendly retry the same event.
    console.error("Calendly webhook processing error:", err);
  }
  return new Response("ok", { status: 200 });
}

interface CalendlyInviteePayload {
  email?: string;
  name?: string;
  tracking?: { utm_content?: string | null };
  scheduled_event?: { uri?: string; name?: string; start_time?: string };
}

async function handleCreated(firmId: string, p: CalendlyInviteePayload) {
  const eventUri = p.scheduled_event?.uri;
  const startTime = p.scheduled_event?.start_time;
  if (!eventUri || !startTime) return;
  const when = new Date(startTime);
  if (isNaN(when.getTime())) return;

  // Idempotency: ignore duplicate deliveries of the same booking.
  const dupe = await prisma.deadline.findFirst({ where: { firmId, calendlyEventUri: eventUri }, select: { id: true } });
  if (dupe) return;

  const caseId = await resolveCaseId(firmId, p);
  if (!caseId) return; // Can't attach to a matter — acknowledge without creating.

  const title = `${p.scheduled_event?.name || "Meeting"}${p.name ? ` with ${p.name}` : ""}`.slice(0, 120);
  const deadline = await prisma.deadline.create({
    data: {
      title,
      description: `Booked via Calendly${p.email ? ` by ${p.email}` : ""}.`.slice(0, 500),
      dueDate: when,
      deadlineType: "CLIENT_MEETING",
      priority: "MEDIUM",
      caseId,
      firmId,
      calendlyEventUri: eventUri,
    },
    select: { id: true, title: true, case: { select: { caseNumber: true } } },
  });

  await logAudit({
    firmId, action: "deadline.create", entity: "Deadline", entityId: deadline.id, entityLabel: deadline.title,
    details: `Calendly booking on ${deadline.case?.caseNumber ?? "matter"}`,
  });
}

async function handleCanceled(firmId: string, p: CalendlyInviteePayload) {
  const eventUri = p.scheduled_event?.uri;
  if (!eventUri) return;
  const existing = await prisma.deadline.findFirst({ where: { firmId, calendlyEventUri: eventUri }, select: { id: true, title: true } });
  if (!existing) return;
  await prisma.deadline.delete({ where: { id: existing.id } });
  await logAudit({ firmId, action: "deadline.delete", entity: "Deadline", entityId: existing.id, entityLabel: existing.title, details: "Calendly booking canceled" });
}

/**
 * Resolve which matter a booking belongs to: prefer the caseId we passed through
 * as utm_content on the booking link; otherwise match the invitee's email to a
 * client and pick their most-recently-updated open matter.
 */
async function resolveCaseId(firmId: string, p: CalendlyInviteePayload): Promise<string | null> {
  const utm = p.tracking?.utm_content?.trim();
  if (utm) {
    const c = await prisma.case.findFirst({ where: { id: utm, firmId }, select: { id: true } });
    if (c) return c.id;
  }
  const email = p.email?.trim().toLowerCase();
  if (email) {
    const client = await prisma.client.findFirst({
      where: { firmId, email: { equals: email, mode: "insensitive" } },
      select: {
        cases: {
          where: { status: { in: ["OPEN", "ACTIVE", "ON_HOLD", "PENDING"] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (client?.cases[0]) return client.cases[0].id;
  }
  return null;
}
