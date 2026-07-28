import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

const OPEN_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "WAITING_APPROVAL"] as const;
const NEXT_PRIORITY: Record<string, string> = { LOW: "MEDIUM", MEDIUM: "HIGH", HIGH: "URGENT", URGENT: "URGENT" };

/**
 * Escalate overdue tasks — raise the priority of any open task past its due date.
 * Run it two ways:
 *   • Scheduler: POST with header `x-cron-secret: $CRON_SECRET` → all firms.
 *   • Admin (on demand): authenticated request → the caller's firm only.
 * Idempotent-ish: priority climbs one level per run toward URGENT, then holds.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  const isCron = !!secret && provided === secret;

  let firmScope: string | undefined;
  if (!isCron) {
    const ctx = await getOrgFirmIds();
    if (!ctx || !ctx.firmId) return errorResponse("Unauthorized", 401);
    if (ctx.role !== "ADMIN") return errorResponse("Admin only", 403);
    firmScope = ctx.firmId;
  }

  const overdue = await prisma.task.findMany({
    where: {
      status: { in: [...OPEN_STATUSES] },
      dueDate: { lt: new Date() },
      priority: { not: "URGENT" }, // already-urgent tasks need no further bump
      ...(firmScope ? { firmId: firmScope } : {}),
    },
    select: { id: true, priority: true },
    take: 5000,
  });

  let escalated = 0;
  await Promise.all(
    overdue.map((t) =>
      prisma.task
        .update({ where: { id: t.id }, data: { priority: NEXT_PRIORITY[t.priority] as "LOW" | "MEDIUM" | "HIGH" | "URGENT" } })
        .then(() => { escalated += 1; })
        .catch(() => {})
    )
  );

  return successResponse({ escalated, scope: firmScope ? "firm" : "all-firms" });
}
