import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Export the firm's full audit trail as CSV — admin only, itself audit-logged. */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "audit.view")) return errorResponse("Only an admin can export the audit log.", 403);

  const logs = await prisma.auditLog.findMany({
    where: { firmId: ctx.firmId },
    orderBy: { createdAt: "desc" },
    take: 50_000,
    select: { createdAt: true, actorName: true, action: true, category: true, entity: true, entityLabel: true, details: true },
  });

  const header = ["Timestamp (UTC)", "Actor", "Action", "Category", "Entity", "Entity label", "Details"];
  const rows = logs.map((l) => [
    l.createdAt.toISOString(), l.actorName, l.action, l.category, l.entity, l.entityLabel ?? "", l.details ?? "",
  ].map(esc).join(","));
  const csv = [header.map(esc).join(","), ...rows].join("\n");

  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "audit.export", category: "data", entity: "AuditLog", entityId: ctx.firmId, entityLabel: `${logs.length} entries`, details: "Audit log exported to CSV" });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linoscore-audit-log-${date}.csv"`,
    },
  });
}
