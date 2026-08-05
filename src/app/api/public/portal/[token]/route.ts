import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { computeMatterProgress } from "@/lib/matter-progress";

export const runtime = "nodejs";

import { PORTAL_CLIENT_UPLOADER } from "@/lib/portal";

// Documents appropriate to show a client (never internal work-product/notes).
const CLIENT_DOC_TYPES = ["ENGAGEMENT_LETTER", "COURT_FILING", "CORRESPONDENCE", "INVOICE"] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const matter = await prisma.case.findFirst({
    where: { portalToken: token, portalEnabled: true },
    select: {
      id: true, title: true, caseNumber: true, firmId: true,
      firm: { select: { name: true, email: true, phone: true } },
      client: { select: { name: true } },
    },
  });
  if (!matter) return errorResponse("This portal link is not active", 404);

  const progress = await computeMatterProgress(matter.id, matter.firmId);

  const [documents, billing] = await Promise.all([
    prisma.document.findMany({
      where: {
        caseId: matter.id, firmId: matter.firmId,
        OR: [
          { documentType: { in: [...CLIENT_DOC_TYPES] } },
          { signatureStatus: "PENDING" },
          { uploadedBy: PORTAL_CLIENT_UPLOADER }, // the client's own uploads
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, documentType: true, signatureStatus: true, uploadedBy: true, updatedAt: true },
    }),
    prisma.billingRecord.aggregate({
      where: { caseId: matter.id, firmId: matter.firmId, paymentStatus: { in: ["UNPAID", "OUTSTANDING", "OVERDUE"] } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ]);

  const outstanding = Math.max(0, Number(billing._sum.totalAmount ?? 0) - Number(billing._sum.paidAmount ?? 0));

  return successResponse({
    firmName: matter.firm.name,
    firmEmail: matter.firm.email,
    firmPhone: matter.firm.phone,
    clientName: matter.client.name,
    matterTitle: matter.title,
    matterNumber: matter.caseNumber,
    progress: progress?.stages ?? [],
    currentLabel: progress?.currentLabel ?? "In progress",
    closed: progress?.closed ?? false,
    outstandingBalance: outstanding,
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      documentType: d.documentType,
      signatureStatus: d.signatureStatus,
      uploadedByClient: d.uploadedBy === PORTAL_CLIENT_UPLOADER,
    })),
  });
}
