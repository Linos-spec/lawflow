import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { updateClientSchema, normalizeClientInput } from "@/lib/validators/client.schema";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";

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
      data: normalizeClientInput(validated),
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
  if (!can(ctx.role, "client.delete")) return errorResponse("Only an admin can erase a client.", 403);

  const { clientId } = await params;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, firmId: ctx.firmId },
    select: { id: true, name: true },
  });
  if (!existing) return errorResponse("Client not found", 404);

  await prisma.client.delete({ where: { id: clientId } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "client.erase", category: "data", entity: "Client", entityId: clientId, entityLabel: existing.name, details: "Right-to-erasure: client and related records deleted" });

  return successResponse({ deleted: true });
}
