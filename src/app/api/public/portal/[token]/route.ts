import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api/response";
import { computeMatterProgress } from "@/lib/matter-progress";
import { resolvePortalAccess } from "@/lib/portal-access";

export const runtime = "nodejs";

import { PORTAL_CLIENT_UPLOADER } from "@/lib/portal";

// Documents appropriate to show a client (never internal work-product/notes).
const CLIENT_DOC_TYPES = ["ENGAGEMENT_LETTER", "COURT_FILING", "CORRESPONDENCE", "INVOICE"] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await resolvePortalAccess(token, req.headers.get("x-portal-pin"));
  // 200 JSON with flags (never a 5xx — proxies swallow those); the page renders
  // the right gate/state from the flag.
  if (!access.ok) {
    if (access.reason === "expired") return successResponse({ expired: true });
    if (access.reason === "pin_required") return successResponse({ requiresPin: true });
    if (access.reason === "pin_invalid") return successResponse({ requiresPin: true, pinError: true });
    return successResponse({ notActive: true });
  }

  const matter = await prisma.case.findUnique({
    where: { id: access.matter.id },
    select: {
      id: true, title: true, caseNumber: true, firmId: true,
      firm: { select: { name: true, email: true, phone: true } },
      client: { select: { name: true } },
    },
  });
  if (!matter) return successResponse({ notActive: true });

  // Mark firm→client messages as read now that the client is viewing.
  await prisma.portalMessage.updateMany({
    where: { caseId: matter.id, sender: "FIRM", readByClient: false },
    data: { readByClient: true },
  }).catch(() => {});

  const progress = await computeMatterProgress(matter.id, matter.firmId);

  const [documents, billing, messages] = await Promise.all([
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
    prisma.portalMessage.findMany({
      where: { caseId: matter.id },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true, sender: true, authorName: true, body: true, createdAt: true },
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
    messages: messages.map((m) => ({
      id: m.id,
      fromClient: m.sender === "CLIENT",
      authorName: m.authorName,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

/** Client sends a message to the firm from the portal. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await resolvePortalAccess(token, req.headers.get("x-portal-pin"));
  if (!access.ok) return successResponse({ notActive: true });

  let body: { message?: string };
  try { body = await req.json(); } catch { return successResponse({ error: "Invalid request" }); }
  const text = (body.message || "").trim();
  if (!text) return successResponse({ error: "Message is empty" });

  const created = await prisma.portalMessage.create({
    data: { caseId: access.matter.id, firmId: access.matter.firmId, sender: "CLIENT", body: text.slice(0, 4000), readByFirm: false, readByClient: true },
    select: { id: true, body: true, createdAt: true },
  });
  return successResponse({ sent: true, message: { id: created.id, fromClient: true, body: created.body, createdAt: created.createdAt.toISOString() } }, 201);
}
