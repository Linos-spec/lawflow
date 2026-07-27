import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createDeliveryClient, DeliveryError } from "@/lib/delivery-client";
import { createDocument } from "@/lib/document-pipeline";

export const runtime = "nodejs";

const PROOF_READY = /delivered|filed|completed/i;

/** Poll the courier for the latest status; pull the custody certificate once it's available. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { id } = await params;

  const record = await prisma.deliveryRequest.findFirst({ where: { id, firmId: ctx.firmId } });
  if (!record) return errorResponse("Delivery not found", 404);

  const firm = await prisma.firm.findUniqueOrThrow({
    where: { id: ctx.firmId },
    select: { deliveryApiEmail: true, deliveryApiPassword: true },
  });
  if (!firm.deliveryApiEmail || !firm.deliveryApiPassword) {
    return errorResponse("Linoscore Delivery is not connected", 400);
  }

  const client = createDeliveryClient({ email: firm.deliveryApiEmail, password: firm.deliveryApiPassword });
  try {
    const detail = await client.getDelivery(record.externalId);

    let proofDocumentId = record.proofDocumentId;
    // Once delivered/filed, pull the court-stamped custody certificate back onto the matter.
    if (!proofDocumentId && PROOF_READY.test(detail.status)) {
      try {
        const cert = await client.getCustodyCertificate(record.externalId);
        const doc = await createDocument({
          firmId: ctx.firmId,
          buffer: cert.buffer,
          fileName: `Proof of Delivery - ${record.trackingNumber || record.externalId}.pdf`,
          mimeType: cert.contentType.includes("pdf") ? "application/pdf" : cert.contentType,
          title: `Proof of Delivery — ${record.trackingNumber || "filing"}`,
          caseId: record.caseId,
        });
        await prisma.document.update({ where: { id: doc.id }, data: { documentType: "COURT_FILING" } });
        proofDocumentId = doc.id;
      } catch (e) {
        console.error("Custody certificate fetch failed (will retry on next refresh):", e);
      }
    }

    const updated = await prisma.deliveryRequest.update({
      where: { id: record.id },
      data: {
        status: detail.status,
        trackingNumber: detail.trackingNumber ?? record.trackingNumber,
        serviceLevel: detail.serviceLevel ?? record.serviceLevel,
        priority: detail.priority ?? record.priority,
        proofDocumentId,
        lastSyncedAt: new Date(),
      },
    });
    return successResponse(updated);
  } catch (err) {
    if (err instanceof DeliveryError) return errorResponse(`Delivery service: ${err.message}`, 502);
    console.error("Refresh delivery error:", err);
    return errorResponse("Failed to refresh delivery status", 500);
  }
}
