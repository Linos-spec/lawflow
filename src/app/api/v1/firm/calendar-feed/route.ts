import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";

export const runtime = "nodejs";

function feedUrl(req: NextRequest, token: string) {
  return `${publicBaseUrl(req)}/api/public/calendar/${token}.ics`;
}

/** Current calendar-subscription URL for the firm (null if not generated yet). */
export async function GET(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { calendarToken: true } });
  return successResponse({ url: firm?.calendarToken ? feedUrl(req, firm.calendarToken) : null });
}

/** Generate (or rotate) the firm's calendar-feed token and return the subscribe URL. */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const rotate = req.nextUrl.searchParams.get("rotate") === "1";
  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { calendarToken: true } });
  const token = (!rotate && firm?.calendarToken) || randomUUID();
  await prisma.firm.update({ where: { id: ctx.firmId }, data: { calendarToken: token } });
  return successResponse({ url: feedUrl(req, token) });
}
