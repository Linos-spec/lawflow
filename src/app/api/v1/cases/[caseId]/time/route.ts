import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const num = (d: unknown) => Number(d as number);

/** Time entries for a matter, with billable/unbilled totals. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
  if (!c) return errorResponse("Matter not found", 404);

  const entries = await prisma.timeEntry.findMany({
    where: { caseId, firmId: ctx.firmId },
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  });

  let billableHours = 0, billableAmount = 0, unbilledAmount = 0, totalHours = 0;
  for (const e of entries) {
    const h = num(e.hours), amt = num(e.hours) * num(e.rate);
    totalHours += h;
    if (e.billable) { billableHours += h; billableAmount += amt; if (!e.billed) unbilledAmount += amt; }
  }

  return successResponse({
    totals: {
      totalHours: Math.round(totalHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      billableAmount: Math.round(billableAmount * 100) / 100,
      unbilledAmount: Math.round(unbilledAmount * 100) / 100,
    },
    entries: entries.map((e) => ({
      id: e.id, description: e.description, hours: num(e.hours), rate: num(e.rate),
      amount: Math.round(num(e.hours) * num(e.rate) * 100) / 100,
      date: e.date.toISOString(), billable: e.billable, billed: e.billed,
      user: e.user?.name || "—",
    })),
  });
}

/** Log a time entry on a matter. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId || !ctx.userId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true, caseNumber: true, title: true } });
  if (!c) return errorResponse("Matter not found", 404);

  let body: { description?: string; hours?: number; rate?: number; date?: string; billable?: boolean };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }

  const description = (body.description || "").trim();
  const hours = Number(body.hours);
  const rate = Number(body.rate);
  if (!description) return errorResponse("Describe the work done.", 400);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return errorResponse("Enter hours between 0 and 24.", 400);
  if (!Number.isFinite(rate) || rate < 0) return errorResponse("Enter a valid hourly rate.", 400);

  const date = body.date ? new Date(body.date) : new Date();
  if (isNaN(date.getTime())) return errorResponse("Invalid date.", 400);

  const entry = await prisma.timeEntry.create({
    data: {
      description, hours, rate, date,
      billable: body.billable !== false,
      firmId: ctx.firmId, caseId, userId: ctx.userId,
    },
    select: { id: true },
  });

  await logAudit({
    firmId: ctx.firmId, userId: ctx.userId, action: "time.create", category: "data",
    entity: "TimeEntry", entityId: entry.id, entityLabel: `${hours}h on ${c.caseNumber}`,
    details: description.slice(0, 120),
  });

  return successResponse({ id: entry.id }, 201);
}
