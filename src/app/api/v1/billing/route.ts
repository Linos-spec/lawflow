import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api/response";
import { createBillingSchema } from "@/lib/validators/billing.schema";

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const paymentStatus = searchParams.get("paymentStatus") || "";

  const where = {
    firmId: ctx.firmId,
    ...(paymentStatus && {
      paymentStatus: paymentStatus as "UNPAID" | "PARTIAL" | "PAID" | "OUTSTANDING" | "OVERDUE" | "VOID",
    }),
  };

  const [records, total] = await Promise.all([
    prisma.billingRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        client: { select: { id: true, name: true } },
        case: { select: { id: true, title: true, caseNumber: true } },
        lineItems: true,
      },
    }),
    prisma.billingRecord.count({ where }),
  ]);

  return paginatedResponse(records, total, page, limit);
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validated = createBillingSchema.parse(body);

    // Generate invoice number
    const count = await prisma.billingRecord.count({ where: { firmId: ctx.firmId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    const totalAmount = validated.lineItems.reduce((sum, li) => sum + li.amount, 0);

    const record = await prisma.billingRecord.create({
      data: {
        invoiceNumber,
        billingType: validated.billingType,
        totalAmount,
        clientId: validated.clientId,
        caseId: validated.caseId,
        dueDate: new Date(validated.dueDate),
        notes: validated.notes || null,
        firmId: ctx.firmId,
        lineItems: {
          create: validated.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            rate: li.rate,
            amount: li.amount,
          })),
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        case: { select: { id: true, title: true } },
        lineItems: true,
      },
    });

    return successResponse(record, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create billing record error:", error);
    return errorResponse("Internal server error", 500);
  }
}
