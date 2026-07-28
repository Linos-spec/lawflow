import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

export const runtime = "nodejs";

const RELATIONSHIP_TYPES = [
  "SPOUSE", "FORMER_SPOUSE", "PARTNER", "DEPENDENT", "CHILD", "PARENT", "GUARDIAN",
  "BUSINESS_PARTNER", "EMPLOYER", "RELATED_COMPANY", "SUBSIDIARY", "AFFILIATE",
  "PARENT_COMPANY", "TRUSTEE", "BENEFICIARY", "EXECUTOR", "POWER_OF_ATTORNEY",
  "AUTHORIZED_REPRESENTATIVE", "DECISION_MAKER", "EMERGENCY_CONTACT", "OTHER",
] as const;

const createSchema = z.object({
  relationshipType: z.enum(RELATIONSHIP_TYPES),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  organization: z.string().optional(),
  address: z.string().optional(),
  isPrimaryDecisionMaker: z.boolean().optional(),
  hasPowerOfAttorney: z.boolean().optional(),
  notes: z.string().optional(),
  relatedClientId: z.string().optional(),
});

async function ownsClient(firmId: string, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, firmId }, select: { id: true } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { clientId } = await params;
  if (!(await ownsClient(ctx.firmId, clientId))) return errorResponse("Client not found", 404);

  const contacts = await prisma.relatedContact.findMany({
    where: { clientId, firmId: ctx.firmId },
    orderBy: { createdAt: "asc" },
    include: { relatedClient: { select: { id: true, name: true } } },
  });
  return successResponse(contacts);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { clientId } = await params;
  if (!(await ownsClient(ctx.firmId, clientId))) return errorResponse("Client not found", 404);

  let input: z.infer<typeof createSchema>;
  try {
    input = createSchema.parse(await request.json());
  } catch {
    return errorResponse("A relationship type and name are required", 400);
  }

  // If linking to another client, verify it belongs to this firm.
  if (input.relatedClientId && !(await ownsClient(ctx.firmId, input.relatedClientId))) {
    return errorResponse("Linked client not found", 400);
  }

  const contact = await prisma.relatedContact.create({
    data: {
      firmId: ctx.firmId,
      clientId,
      relationshipType: input.relationshipType,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      organization: input.organization || null,
      address: input.address || null,
      isPrimaryDecisionMaker: input.isPrimaryDecisionMaker ?? false,
      hasPowerOfAttorney: input.hasPowerOfAttorney ?? false,
      notes: input.notes || null,
      relatedClientId: input.relatedClientId || null,
    },
  });
  return successResponse(contact, 201);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { clientId } = await params;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return errorResponse("Contact id required", 400);

  const existing = await prisma.relatedContact.findFirst({ where: { id, clientId, firmId: ctx.firmId }, select: { id: true } });
  if (!existing) return errorResponse("Contact not found", 404);

  await prisma.relatedContact.delete({ where: { id } });
  return successResponse({ deleted: true });
}
