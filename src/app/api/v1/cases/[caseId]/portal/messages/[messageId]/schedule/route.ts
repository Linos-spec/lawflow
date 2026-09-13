import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

interface Proposal { title?: string; startsAt?: string; durationMins?: number; note?: string }

/**
 * Confirm an AI-suggested meeting from a client portal message: create a
 * CLIENT_MEETING deadline on the matter (which flows to the firm's subscribed
 * calendar via the iCal feed). Attorney-gated — only a firm user can call this,
 * and it accepts optional overrides so the attorney can adjust before saving.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string; messageId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const firmId = ctx.firmId;   // capture so narrowing survives the transaction closure
  const { caseId, messageId } = await params;

  const matter = await prisma.case.findFirst({ where: { id: caseId, firmId }, select: { id: true, caseNumber: true } });
  if (!matter) return errorResponse("Matter not found", 404);

  const msg = await prisma.portalMessage.findFirst({
    where: { id: messageId, caseId, firmId },
    select: { id: true, meetingProposal: true, meetingDeadlineId: true },
  });
  if (!msg) return errorResponse("Message not found", 404);
  if (msg.meetingDeadlineId) return errorResponse("A calendar entry was already created for this message.", 409);

  const proposal = (msg.meetingProposal ?? {}) as Proposal;

  // Attorney overrides win; otherwise fall back to the AI proposal.
  let overrides: { title?: string; startsAt?: string; durationMins?: number } = {};
  try { overrides = await req.json(); } catch { /* no body — use proposal as-is */ }

  const title = (overrides.title || proposal.title || "Client meeting").toString().slice(0, 120);
  const startsAtStr = overrides.startsAt || proposal.startsAt;
  const when = startsAtStr ? new Date(startsAtStr) : null;
  if (!when || isNaN(when.getTime())) return errorResponse("A valid date and time is required.", 400);

  const created = await prisma.$transaction(async (tx) => {
    const deadline = await tx.deadline.create({
      data: {
        title,
        description: proposal.note ? `From client portal: ${proposal.note}`.slice(0, 500) : "Scheduled from a client portal message.",
        dueDate: when,
        deadlineType: "CLIENT_MEETING",
        priority: "MEDIUM",
        caseId,
        firmId,
      },
      select: { id: true, title: true, dueDate: true },
    });
    await tx.portalMessage.update({ where: { id: messageId }, data: { meetingDeadlineId: deadline.id } });
    return deadline;
  });

  await logAudit({
    firmId, userId: ctx.userId,
    action: "deadline.create", entity: "Deadline", entityId: created.id, entityLabel: created.title,
    details: `client-portal meeting on ${matter.caseNumber}`,
  });

  return successResponse({
    deadline: { id: created.id, title: created.title, dueDate: created.dueDate.toISOString() },
  }, 201);
}
