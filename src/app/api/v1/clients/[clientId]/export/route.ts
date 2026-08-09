import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";

/**
 * Data subject access request (DSAR): export everything the firm holds about a
 * client as a portable JSON package. Admin/partner only, audit-logged. Document
 * bytes are excluded — metadata only — to keep the export portable.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "client.export")) return errorResponse("Only an admin or partner can export client data.", 403);

  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, firmId: ctx.firmId },
    include: {
      cases: {
        include: {
          deadlines: true,
          documents: { select: { id: true, title: true, originalName: true, documentType: true, signatureStatus: true, createdAt: true } },
          billingRecords: { include: { lineItems: true } },
        },
      },
      billingRecords: { include: { lineItems: true } },
    },
  });
  if (!client) return errorResponse("Client not found", 404);

  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "client.export", category: "data", entity: "Client", entityId: clientId, entityLabel: client.name, details: "DSAR data export generated" });

  const pkg = {
    exportType: "client-data-subject-access-request",
    generatedAt: new Date().toISOString(),
    generatedBy: ctx.userId,
    client,
  };

  const filename = `client-export-${client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
  return new Response(JSON.stringify(pkg, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
