import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createDeliveryClient, DeliveryError, type ServiceLevel, type DeliveryPriority } from "@/lib/delivery-client";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  recipientName: z.string().min(1),
  dropoff: z.object({
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  }),
  serviceLevel: z.enum(["Routine", "Priority", "Emergency"]).default("Routine"),
  priority: z.enum(["Standard", "Expedited", "Rush", "SameDay"]).default("Standard"),
  isCourtFiling: z.boolean().default(false),
  dropoffSummary: z.string().optional(),
  documentId: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const deliveries = await prisma.deliveryRequest.findMany({
    where: { caseId, firmId: ctx.firmId },
    orderBy: { createdAt: "desc" },
  });
  return successResponse(deliveries);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  const matter = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true, caseNumber: true } });
  if (!matter) return errorResponse("Matter not found", 404);

  const firm = await prisma.firm.findUniqueOrThrow({
    where: { id: ctx.firmId },
    select: {
      deliveryConnected: true, deliveryApiEmail: true, deliveryApiPassword: true,
      deliveryPickupLine1: true, deliveryPickupLine2: true, deliveryPickupCity: true,
      deliveryPickupState: true, deliveryPickupPostal: true,
    },
  });
  if (!firm.deliveryConnected || !firm.deliveryApiEmail || !firm.deliveryApiPassword) {
    return errorResponse("Connect Linoscore Delivery in Settings before sending a delivery", 400);
  }
  if (!firm.deliveryPickupLine1 || !firm.deliveryPickupCity || !firm.deliveryPickupState || !firm.deliveryPickupPostal) {
    return errorResponse("Set your firm's pickup address in Settings first", 400);
  }

  let input: z.infer<typeof createSchema>;
  try {
    input = createSchema.parse(await request.json());
  } catch {
    return errorResponse("Validation failed", 400);
  }

  const client = createDeliveryClient({ email: firm.deliveryApiEmail, password: firm.deliveryApiPassword });
  try {
    const detail = await client.createDelivery(
      {
        recipientName: input.recipientName,
        reference: matter.caseNumber, // matter number → delivery reference
        pickupAddress: {
          line1: firm.deliveryPickupLine1, line2: firm.deliveryPickupLine2, city: firm.deliveryPickupCity,
          state: firm.deliveryPickupState, postalCode: firm.deliveryPickupPostal,
        },
        dropoffAddress: {
          line1: input.dropoff.line1, line2: input.dropoff.line2, city: input.dropoff.city,
          state: input.dropoff.state, postalCode: input.dropoff.postalCode,
        },
        serviceLevel: input.serviceLevel as ServiceLevel,
        priority: input.priority as DeliveryPriority,
        industry: "Legal",
        submitImmediately: true,
      },
      randomUUID(),
    );

    const record = await prisma.deliveryRequest.create({
      data: {
        firmId: ctx.firmId,
        caseId: matter.id,
        externalId: detail.id,
        trackingNumber: detail.trackingNumber,
        status: detail.status,
        serviceLevel: detail.serviceLevel,
        priority: detail.priority,
        recipientName: input.recipientName,
        reference: matter.caseNumber,
        isCourtFiling: input.isCourtFiling,
        dropoffSummary: input.dropoffSummary || `${input.dropoff.line1}, ${input.dropoff.city}`,
        documentId: input.documentId || null,
        createdBy: ctx.userId,
        lastSyncedAt: new Date(),
      },
    });
    return successResponse(record, 201);
  } catch (err) {
    if (err instanceof DeliveryError) return errorResponse(`Delivery service: ${err.message}`, 502);
    console.error("Create delivery error:", err);
    return errorResponse("Failed to create delivery", 500);
  }
}
