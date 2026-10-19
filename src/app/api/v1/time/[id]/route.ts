import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Edit a time entry (description, hours, rate, date, billable). Can't edit once billed. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { id } = await params;
  const entry = await prisma.timeEntry.findFirst({ where: { id, firmId: ctx.firmId }, select: { id: true, billed: true } });
  if (!entry) return errorResponse("Time entry not found", 404);
  if (entry.billed) return errorResponse("This entry is already on an invoice and can't be edited.", 409);

  let body: { description?: string; hours?: number; rate?: number; date?: string; billable?: boolean };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }

  const data: Record<string, unknown> = {};
  if (body.description !== undefined) { const d = body.description.trim(); if (!d) return errorResponse("Description required.", 400); data.description = d; }
  if (body.hours !== undefined) { const h = Number(body.hours); if (!Number.isFinite(h) || h <= 0 || h > 24) return errorResponse("Hours must be 0–24.", 400); data.hours = h; }
  if (body.rate !== undefined) { const r = Number(body.rate); if (!Number.isFinite(r) || r < 0) return errorResponse("Invalid rate.", 400); data.rate = r; }
  if (body.date !== undefined) { const d = new Date(body.date); if (isNaN(d.getTime())) return errorResponse("Invalid date.", 400); data.date = d; }
  if (body.billable !== undefined) data.billable = !!body.billable;
  if (Object.keys(data).length === 0) return errorResponse("Nothing to update", 400);

  await prisma.timeEntry.update({ where: { id }, data });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "time.update", category: "data", entity: "TimeEntry", entityId: id, entityLabel: id });
  return successResponse({ ok: true });
}

/** Delete a time entry (only if not yet billed). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { id } = await params;
  const entry = await prisma.timeEntry.findFirst({ where: { id, firmId: ctx.firmId }, select: { id: true, billed: true } });
  if (!entry) return errorResponse("Time entry not found", 404);
  if (entry.billed) return errorResponse("This entry is already on an invoice and can't be deleted.", 409);
  await prisma.timeEntry.delete({ where: { id } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "time.delete", category: "data", entity: "TimeEntry", entityId: id, entityLabel: id });
  return successResponse({ deleted: true });
}
