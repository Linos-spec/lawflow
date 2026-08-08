import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logIntakeEvent } from "@/lib/intake-events";
import { INTAKE_TRANSITIONS, INTAKE_STATUS_LABELS, type IntakeStatus } from "@/lib/intake";

export const runtime = "nodejs";

/** Which key intake fields are still missing (drives the "Missing information" panel). */
function missingInfo(lead: {
  email: string | null; phone: string | null; description: string | null;
  addressOrJurisdiction: string | null; importantDates: string | null;
}): string[] {
  const missing: string[] = [];
  if (!lead.email && !lead.phone) missing.push("Contact email or phone");
  else {
    if (!lead.email) missing.push("Email address");
    if (!lead.phone) missing.push("Phone number");
  }
  if (!lead.description?.trim()) missing.push("Description of the matter");
  if (!lead.addressOrJurisdiction?.trim()) missing.push("Address / jurisdiction");
  if (!lead.importantDates?.trim()) missing.push("Key dates or deadlines");
  return missing;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, firmId: ctx.firmId },
    include: {
      conflictChecks: { orderBy: { createdAt: "desc" } },
      intakeEvents: { orderBy: { createdAt: "desc" } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  if (!lead) return errorResponse("Intake not found", 404);

  const users = await prisma.user.findMany({
    where: { firmId: ctx.firmId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return successResponse({
    lead,
    missing: missingInfo(lead),
    users,
    allowedTransitions: INTAKE_TRANSITIONS[lead.intakeStatus as IntakeStatus] || [],
  });
}

/** Move status, (re)assign, or add a note — each writes to the audit trail. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, firmId: ctx.firmId },
    select: { id: true, intakeStatus: true },
  });
  if (!lead) return errorResponse("Intake not found", 404);

  let body: { action?: string; toStatus?: string; assignedToId?: string | null; note?: string };
  try { body = await request.json(); } catch { return errorResponse("Invalid request", 400); }

  const me = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true } });
  const actorLabel = me?.name || "A teammate";
  const from = lead.intakeStatus as IntakeStatus;

  try {
    if (body.action === "status") {
      const to = body.toStatus as IntakeStatus;
      if (!to || !(INTAKE_TRANSITIONS[from] || []).includes(to)) {
        return errorResponse("That status change isn't allowed from the current state.", 400);
      }
      await prisma.$transaction(async (tx) => {
        await tx.lead.update({ where: { id: leadId }, data: { intakeStatus: to } });
        await logIntakeEvent(tx, {
          leadId, firmId: ctx.firmId!, type: "status_change", actorLabel, actorId: ctx.userId,
          fromStatus: from, toStatus: to,
          note: `Moved from ${INTAKE_STATUS_LABELS[from]} to ${INTAKE_STATUS_LABELS[to]}`,
        });
      });
      return successResponse({ ok: true });
    }

    if (body.action === "assign") {
      const assignedToId = body.assignedToId || null;
      let assigneeName = "Unassigned";
      if (assignedToId) {
        const u = await prisma.user.findFirst({ where: { id: assignedToId, firmId: ctx.firmId }, select: { name: true } });
        if (!u) return errorResponse("Assignee not found", 400);
        assigneeName = u.name;
      }
      await prisma.$transaction(async (tx) => {
        await tx.lead.update({ where: { id: leadId }, data: { assignedToId } });
        await logIntakeEvent(tx, {
          leadId, firmId: ctx.firmId!, type: "assigned", actorLabel, actorId: ctx.userId,
          note: assignedToId ? `Assigned to ${assigneeName}` : "Unassigned",
        });
      });
      return successResponse({ ok: true });
    }

    if (body.action === "note") {
      const note = (body.note || "").trim();
      if (!note) return errorResponse("Note is empty", 400);
      await logIntakeEvent(prisma, {
        leadId, firmId: ctx.firmId, type: "note", actorLabel, actorId: ctx.userId, note,
      });
      return successResponse({ ok: true });
    }

    return errorResponse("Unknown action", 400);
  } catch (error) {
    console.error("Intake PATCH error:", error);
    return errorResponse("Could not update the intake", 500);
  }
}
