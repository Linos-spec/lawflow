import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * Convert a qualified lead into a Client.
 * Guards against converting a lead with an unresolved conflict — the attorney
 * must review and WAIVE the conflict first (via PATCH) before conversion.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, firmId: ctx.firmId },
  });
  if (!lead) return errorResponse("Lead not found", 404);

  if (lead.convertedClientId) {
    return errorResponse("This lead has already been converted", 409);
  }

  // Ethics guard: don't let an unresolved conflict become a client.
  if (lead.conflictStatus === "CONFLICT") {
    return errorResponse(
      "This lead has an unresolved conflict of interest. An attorney must review and waive the conflict before converting.",
      409
    );
  }

  const client = await prisma.client.create({
    data: {
      firmId: ctx.firmId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      clientType: "INDIVIDUAL",
      notes: lead.description
        ? `Converted from lead. Original inquiry: ${lead.description}`
        : "Converted from lead.",
    },
  });

  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: "CONVERTED", convertedClientId: client.id },
  });

  return successResponse({ client, lead: updatedLead }, 201);
}
