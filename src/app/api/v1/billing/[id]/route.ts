import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { id } = await params;
  const record = await prisma.billingRecord.findFirst({
    where: { id, firmId: ctx.firmId },
    include: {
      lineItems: true,
      client: { select: { id: true, name: true, email: true, address: true, company: true } },
      case: { select: { id: true, title: true, caseNumber: true } },
    },
  });
  if (!record) return errorResponse("Invoice not found", 404);
  return successResponse(record);
}

/** Update invoice status (e.g. mark sent / paid). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { id } = await params;

  const existing = await prisma.billingRecord.findFirst({ where: { id, firmId: ctx.firmId }, select: { id: true, invoiceNumber: true, totalAmount: true } });
  if (!existing) return errorResponse("Invoice not found", 404);

  const body = await request.json().catch(() => ({}));
  const status = body.paymentStatus as string | undefined;
  const allowed = ["UNPAID", "PARTIAL", "PAID", "OUTSTANDING", "OVERDUE", "VOID"];
  if (!status || !allowed.includes(status)) return errorResponse("Invalid status", 400);

  const data: { paymentStatus: string; paidAmount?: number } = { paymentStatus: status };
  if (status === "PAID") data.paidAmount = Number(existing.totalAmount);
  if (status === "UNPAID") data.paidAmount = 0;

  const updated = await prisma.billingRecord.update({ where: { id }, data: data as never });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "invoice.update", entity: "Invoice", entityId: id, entityLabel: existing.invoiceNumber, details: `Status → ${status.toLowerCase()}` });
  return successResponse(updated);
}
