import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { testDeliveryConnection, DeliveryError } from "@/lib/delivery-client";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  pickup: z.object({
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  }),
});

/** Connect (or update) the firm's Linoscore Delivery account. Admin only. Verifies the login before saving. */
export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return forbiddenResponse();

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return errorResponse("Provide the Linoscore Delivery email, password, and pickup address", 400);
  }

  // Verify the credentials against the live courier API before storing them.
  try {
    const { customerId } = await testDeliveryConnection(input.email, input.password);
    await prisma.firm.update({
      where: { id: ctx.firmId },
      data: {
        deliveryConnected: true,
        deliveryApiEmail: input.email,
        deliveryApiPassword: input.password, // server-only; never returned to the client
        deliveryCustomerId: customerId,
        deliveryPickupLine1: input.pickup.line1,
        deliveryPickupLine2: input.pickup.line2 || null,
        deliveryPickupCity: input.pickup.city,
        deliveryPickupState: input.pickup.state,
        deliveryPickupPostal: input.pickup.postalCode,
      },
    });
    return successResponse({ connected: true, email: input.email });
  } catch (err) {
    if (err instanceof DeliveryError) return errorResponse(err.message, err.status === 401 ? 400 : 502);
    console.error("Delivery connect error:", err);
    return errorResponse("Could not reach Linoscore Delivery", 502);
  }
}

/** Disconnect the firm's Delivery account. Admin only. */
export async function DELETE() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return forbiddenResponse();

  await prisma.firm.update({
    where: { id: ctx.firmId },
    data: { deliveryConnected: false, deliveryApiEmail: null, deliveryApiPassword: null, deliveryCustomerId: null },
  });
  return successResponse({ connected: false });
}
