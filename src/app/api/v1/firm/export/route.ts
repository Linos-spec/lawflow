import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";

/**
 * Full firm data export — a portable JSON package of everything the firm holds
 * (document bytes excluded — metadata only, to keep it portable). Admin only,
 * audit-logged. This is the "never locked in" guarantee.
 */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "team.manage")) return errorResponse("Only an admin can export firm data.", 403);
  const firmId = ctx.firmId;

  const [firm, users, clients, cases, leads, deadlines, documents, billing, tasks] = await Promise.all([
    prisma.firm.findUnique({ where: { id: firmId }, select: { name: true, email: true, phone: true, address: true, website: true, createdAt: true } }),
    prisma.user.findMany({ where: { firmId }, select: { name: true, email: true, role: true, createdAt: true } }),
    prisma.client.findMany({ where: { firmId } }),
    prisma.case.findMany({ where: { firmId }, include: { client: { select: { name: true } }, responsibleAttorney: { select: { name: true } } } }),
    prisma.lead.findMany({ where: { firmId } }),
    prisma.deadline.findMany({ where: { firmId } }),
    prisma.document.findMany({ where: { firmId }, select: { id: true, title: true, originalName: true, documentType: true, signatureStatus: true, caseId: true, createdAt: true } }),
    prisma.billingRecord.findMany({ where: { firmId }, include: { lineItems: true } }),
    prisma.task.findMany({ where: { firmId } }).catch(() => []),
  ]);

  await logAudit({ firmId, userId: ctx.userId, action: "firm.export", category: "data", entity: "Firm", entityId: firmId, entityLabel: firm?.name || "Firm", details: "Full firm data export generated" });

  const pkg = {
    exportType: "linoscore-legal-firm-data-export",
    generatedAt: new Date().toISOString(),
    note: "Document file contents are not included; document records are metadata only.",
    firm,
    counts: { users: users.length, clients: clients.length, cases: cases.length, leads: leads.length, deadlines: deadlines.length, documents: documents.length, invoices: billing.length, tasks: tasks.length },
    users, clients, cases, leads, deadlines, documents, billing, tasks,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(pkg, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="linoscore-firm-export-${date}.json"`,
    },
  });
}
