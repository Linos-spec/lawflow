import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createEngagementLetter } from "@/lib/engagement-letter";

export const runtime = "nodejs";

/**
 * Draft an engagement letter for a lead on demand. Links it to the converted
 * client/matter when one exists. Saved as a Document (type ENGAGEMENT_LETTER,
 * signature PENDING) for attorney review before sending.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { leadId } = await params;

  const lead = await prisma.lead.findFirst({ where: { id: leadId, firmId: ctx.firmId } });
  if (!lead) return errorResponse("Lead not found", 404);

  const firm = await prisma.firm.findUniqueOrThrow({ where: { id: ctx.firmId }, select: { name: true } });

  try {
    const doc = await createEngagementLetter({
      firmId: ctx.firmId,
      firmName: firm.name,
      clientId: lead.convertedClientId,
      caseId: lead.convertedCaseId,
      clientName: lead.name,
      matterType: lead.caseType,
      matterDescription: lead.description,
      retainer: {
        structure: lead.retainerStructure,
        amountLow: lead.retainerAmountLow,
        amountHigh: lead.retainerAmountHigh,
      },
      uploadedBy: ctx.userId,
    });
    if (!doc) return errorResponse("Engagement letter drafting is unavailable (no AI key configured)", 503);
    return successResponse({ documentId: doc.id, title: doc.title }, 201);
  } catch (err) {
    console.error("Engagement letter route error:", err);
    return errorResponse("Failed to draft engagement letter", 500);
  }
}
