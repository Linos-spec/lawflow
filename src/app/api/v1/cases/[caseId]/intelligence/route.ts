import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { generateCaseIntelligence, gatherCaseRealtimeData, type CaseContext } from "@/lib/case-intelligence";

export const runtime = "nodejs";

async function loadCase(caseId: string, firmId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, firmId },
    include: {
      client: { select: { name: true } },
      documents: { select: { title: true, documentType: true } },
      deadlines: { select: { title: true, dueDate: true, status: true }, orderBy: { dueDate: "asc" } },
    },
  });
}

/** Cached analysis (if any) + always-fresh real data. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  const c = await loadCase(caseId, ctx.firmId);
  if (!c) return errorResponse("Case not found", 404);

  const realtime = await gatherCaseRealtimeData(c);
  return successResponse({ ai: c.aiAnalysis ?? null, aiAnalyzedAt: c.aiAnalyzedAt, ...realtime });
}

/** (Re)generate the AI analysis, cache it, and return everything. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  const c = await loadCase(caseId, ctx.firmId);
  if (!c) return errorResponse("Case not found", 404);

  const context: CaseContext = {
    id: c.id, caseNumber: c.caseNumber, title: c.title, caseType: c.caseType, status: c.status,
    description: c.description, notes: c.notes, clientName: c.client?.name ?? null,
    documents: c.documents, deadlines: c.deadlines,
  };

  const ai = await generateCaseIntelligence(context);
  if (!ai) return errorResponse("AI analysis is unavailable (no AI key configured).", 503);

  const updated = await prisma.case.update({
    where: { id: c.id },
    data: { aiAnalysis: ai, aiAnalyzedAt: new Date() },
    select: { aiAnalyzedAt: true },
  });

  const realtime = await gatherCaseRealtimeData(c);
  return successResponse({ ai, aiAnalyzedAt: updated.aiAnalyzedAt, ...realtime });
}
