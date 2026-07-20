import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/**
 * Customer 360 — aggregates everything pertaining to one client so a lawyer
 * sees the whole relationship in one place: cases, documents, billing,
 * deadlines, time, and intake history, plus headline stats.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, firmId: ctx.firmId },
  });
  if (!client) return errorResponse("Client not found", 404);

  const firmId = ctx.firmId;

  // Cases first — several other queries key off the client's case ids.
  const cases = await prisma.case.findMany({
    where: { clientId, firmId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, caseNumber: true, title: true, status: true,
      caseType: true, priority: true, filingDate: true, createdAt: true,
    },
  });
  const caseIds = cases.map((c) => c.id);
  const caseTitleById = new Map(cases.map((c) => [c.id, c.title]));

  const [
    documents,
    invoices,
    billingAgg,
    timeAgg,
    deadlines,
    intake,
  ] = await Promise.all([
    // Documents linked to the client directly OR to any of their cases.
    prisma.document.findMany({
      where: { firmId, OR: [{ clientId }, ...(caseIds.length ? [{ caseId: { in: caseIds } }] : [])] },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: { id: true, title: true, documentType: true, signatureStatus: true, updatedAt: true, caseId: true },
    }),
    prisma.billingRecord.findMany({
      where: { clientId, firmId },
      orderBy: { issueDate: "desc" },
      take: 25,
      select: { id: true, invoiceNumber: true, totalAmount: true, paidAmount: true, paymentStatus: true, issueDate: true, dueDate: true },
    }),
    prisma.billingRecord.aggregate({
      where: { clientId, firmId },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    // `caseId: { in: [] }` is valid and simply matches nothing.
    prisma.timeEntry.aggregate({ where: { caseId: { in: caseIds }, firmId }, _sum: { hours: true } }),
    prisma.deadline.findMany({
      where: { caseId: { in: caseIds }, firmId, status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
      select: { id: true, title: true, dueDate: true, deadlineType: true, status: true, priority: true, caseId: true },
    }),
    prisma.intakeForm.findMany({
      where: { clientId, firmId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, prospectName: true, caseType: true, status: true, createdAt: true },
    }),
  ]);

  const lifetimeBilled = Number(billingAgg._sum.totalAmount ?? 0);
  const totalPaid = Number(billingAgg._sum.paidAmount ?? 0);
  const activeStatuses = new Set(["OPEN", "ACTIVE", "ON_HOLD", "PENDING"]);

  return successResponse({
    client: {
      id: client.id, name: client.name, email: client.email, phone: client.phone,
      address: client.address, clientType: client.clientType, company: client.company,
      notes: client.notes, createdAt: client.createdAt,
    },
    stats: {
      totalCases: cases.length,
      activeCases: cases.filter((c) => activeStatuses.has(c.status)).length,
      documents: documents.length,
      lifetimeBilled,
      totalPaid,
      outstanding: Math.max(0, lifetimeBilled - totalPaid),
      hoursLogged: Number(timeAgg._sum.hours ?? 0),
      openDeadlines: deadlines.length,
    },
    cases,
    documents,
    invoices: invoices.map((i) => ({
      ...i,
      totalAmount: Number(i.totalAmount),
      paidAmount: Number(i.paidAmount),
    })),
    deadlines: deadlines.map((d) => ({ ...d, caseTitle: caseTitleById.get(d.caseId) ?? null })),
    intake,
  });
}
