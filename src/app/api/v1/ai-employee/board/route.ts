import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/**
 * AI Employee pipeline board — the operational view of the intake-to-close flow.
 * Buckets real leads by funnel stage and surfaces the attorney review queue
 * (conflict-flagged leads). Stages not yet automated are reported as counts of
 * the underlying manual records so the board reflects reality, not a mock.
 */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const firmId = ctx.firmId;

  const [leads, activeCases, openDeadlines, pendingDocs] = await Promise.all([
    prisma.lead.findMany({
      where: { firmId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, caseType: true, stage: true, conflictStatus: true,
        qualificationScore: true, aiPriority: true, aiSummary: true, createdAt: true,
      },
    }),
    prisma.case.count({ where: { firmId, status: { in: ["OPEN", "ACTIVE", "ON_HOLD", "PENDING"] } } }),
    prisma.deadline.count({ where: { firmId, status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.document.count({ where: { firmId, signatureStatus: "PENDING" } }),
  ]);

  const inStages = (s: string[]) => leads.filter((l) => s.includes(l.stage));
  const slim = (arr: typeof leads) => arr.slice(0, 6).map((l) => ({
    id: l.id, name: l.name, caseType: l.caseType, conflictStatus: l.conflictStatus,
    score: l.qualificationScore, priority: l.aiPriority, summary: l.aiSummary,
  }));

  const intake = inStages(["NEW", "QUALIFYING"]);
  const analysis = inStages(["QUALIFIED", "CONSULT_SCHEDULED"]);
  const engaged = inStages(["ENGAGED", "CONVERTED"]);
  const reviewQueue = leads.filter(
    (l) => (l.conflictStatus === "POTENTIAL" || l.conflictStatus === "CONFLICT") && l.stage !== "CONVERTED"
  );

  return successResponse({
    stats: {
      intake: intake.length,
      analysis: analysis.length,
      reviewQueue: reviewQueue.length,
      activeCases,
      openDeadlines,
      pendingDocs,
    },
    columns: {
      intake: slim(intake),
      analysis: slim(analysis),
      engaged: slim(engaged),
      reviewQueue: slim(reviewQueue),
    },
  });
}
