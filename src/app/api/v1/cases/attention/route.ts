import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/**
 * "Which cases need attention?" — an explainable, rules-based ranking (not a
 * black box). Each flagged case carries the concrete facts behind it, so the
 * attorney sees exactly why it surfaced. Works without any AI key.
 */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const now = Date.now();
  const DAY = 86_400_000;

  const cases = await prisma.case.findMany({
    where: { firmId: ctx.firmId, status: { notIn: ["CLOSED", "ARCHIVED"] } },
    select: {
      id: true, title: true, caseNumber: true, status: true, updatedAt: true,
      responsibleAttorneyId: true,
      client: { select: { name: true } },
      deadlines: { where: { status: { in: ["PENDING", "OVERDUE"] } }, select: { title: true, dueDate: true } },
      tasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } }, select: { dueDate: true } },
      billingRecords: { where: { paymentStatus: { in: ["UNPAID", "OUTSTANDING", "OVERDUE"] } }, select: { totalAmount: true, paidAmount: true } },
    },
    take: 500,
  });

  const scored = cases.map((c) => {
    const reasons: { severity: "high" | "medium" | "low"; text: string }[] = [];
    let score = 0;

    // Overdue deadlines (highest priority).
    const overdue = c.deadlines.filter((d) => +new Date(d.dueDate) < now);
    for (const d of overdue.slice(0, 2)) {
      const days = Math.floor((now - +new Date(d.dueDate)) / DAY);
      reasons.push({ severity: "high", text: `Overdue: ${d.title} (${days === 0 ? "today" : `${days}d ago`})` });
      score += 6;
    }
    // Deadlines due within 7 days.
    const soon = c.deadlines.filter((d) => { const t = +new Date(d.dueDate); return t >= now && t <= now + 7 * DAY; });
    for (const d of soon.slice(0, 2)) {
      const days = Math.ceil((+new Date(d.dueDate) - now) / DAY);
      reasons.push({ severity: "medium", text: `Due soon: ${d.title} (in ${days}d)` });
      score += 3;
    }
    // Overdue tasks.
    const overdueTasks = c.tasks.filter((t) => t.dueDate && +new Date(t.dueDate) < now).length;
    if (overdueTasks > 0) { reasons.push({ severity: "medium", text: `${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""}` }); score += 2 * overdueTasks; }

    // Outstanding balance.
    const outstanding = c.billingRecords.reduce((s, b) => s + Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)), 0);
    if (outstanding > 0) { reasons.push({ severity: "low", text: `$${outstanding.toLocaleString()} outstanding` }); score += 2; }

    // Stale (no updates in 21+ days).
    const staleDays = Math.floor((now - +new Date(c.updatedAt)) / DAY);
    if (staleDays >= 21) { reasons.push({ severity: "medium", text: `No activity in ${staleDays}d` }); score += 2; }

    // No responsible attorney.
    if (!c.responsibleAttorneyId) { reasons.push({ severity: "low", text: "No responsible attorney" }); score += 1; }

    return { id: c.id, title: c.title, caseNumber: c.caseNumber, client: c.client.name, score, reasons };
  });

  const flagged = scored.filter((c) => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);

  return successResponse({ count: flagged.length, cases: flagged });
}
