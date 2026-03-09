import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { updateClientSchema } from "@/lib/validators/client.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, firmId: ctx.firmId },
    include: {
      cases: { orderBy: { createdAt: "desc" }, take: 10 },
      billingRecords: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { cases: true, billingRecords: true } },
    },
  });

  if (!client) return errorResponse("Client not found", 404);

  return successResponse(client);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { clientId } = await params;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, firmId: ctx.firmId },
  });
  if (!existing) return errorResponse("Client not found", 404);

  try {
    const body = await request.json();
    const validated = updateClientSchema.parse(body);

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...validated,
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
        company: validated.company || null,
        notes: validated.notes || null,
      },
    });

    return successResponse(client);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Update client error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { clientId } = await params;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, firmId: ctx.firmId },
  });
  if (!existing) return errorResponse("Client not found", 404);

  await prisma.client.delete({ where: { id: clientId } });

  return successResponse({ deleted: true });
}
