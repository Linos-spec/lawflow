import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const num = (d: unknown) => Number(d as number);

/**
 * Generate an invoice from a matter's unbilled, billable time entries.
 * Creates one BillingRecord (HOURLY) with a line item per entry, then marks
 * those entries billed so they can't be invoiced twice.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const firmId = ctx.firmId;   // capture so narrowing survives the transaction closure
  const { caseId } = await params;

  const c = await prisma.case.findFirst({ where: { id: caseId, firmId }, select: { id: true, clientId: true, caseNumber: true, title: true } });
  if (!c) return errorResponse("Matter not found", 404);

  let body: { dueInDays?: number; note?: string } = {};
  try { body = await req.json(); } catch { /* optional body */ }

  const entries = await prisma.timeEntry.findMany({
    where: { caseId, firmId, billable: true, billed: false },
    orderBy: { date: "asc" },
  });
  if (entries.length === 0) return errorResponse("No unbilled billable time to invoice on this matter.", 400);

  const lineItems = entries.map((e) => {
    const hours = num(e.hours), rate = num(e.rate);
    const date = e.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { description: `${date} — ${e.description}`, quantity: hours, rate, amount: Math.round(hours * rate * 100) / 100 };
  });
  const totalAmount = Math.round(lineItems.reduce((s, li) => s + li.amount, 0) * 100) / 100;

  const dueInDays = Number.isFinite(body.dueInDays) ? Math.min(365, Math.max(0, Math.round(body.dueInDays!))) : 30;
  const dueDate = new Date(Date.now() + dueInDays * 86_400_000);

  const invoice = await prisma.$transaction(async (tx) => {
    // Invoice number is unique per firm (@@unique([firmId, invoiceNumber])).
    const count = await tx.billingRecord.count({ where: { firmId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;
    const record = await tx.billingRecord.create({
      data: {
        invoiceNumber, billingType: "HOURLY", totalAmount,
        clientId: c.clientId, caseId, firmId, dueDate,
        notes: body.note?.trim() || null,
        lineItems: { create: lineItems },
      },
      select: { id: true, invoiceNumber: true },
    });
    await tx.timeEntry.updateMany({ where: { id: { in: entries.map((e) => e.id) } }, data: { billed: true } });
    return record;
  });

  await logAudit({
    firmId, userId: ctx.userId, action: "invoice.create", category: "data",
    entity: "Invoice", entityId: invoice.id, entityLabel: `${invoice.invoiceNumber} · ${c.caseNumber}`,
    details: `$${totalAmount.toLocaleString()} from ${entries.length} time ${entries.length === 1 ? "entry" : "entries"}`,
  });

  return successResponse({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, totalAmount, entries: entries.length }, 201);
}
