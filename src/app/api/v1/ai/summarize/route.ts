import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { caseId } = await req.json();
  if (!caseId) {
    return new Response(JSON.stringify({ error: "caseId is required" }), {
      status: 400,
    });
  }

  const caseData = await prisma.case.findFirst({
    where: { id: caseId, firmId: ctx.firmId },
    include: {
      client: true,
      deadlines: { orderBy: { dueDate: "asc" } },
      billingRecords: { include: { lineItems: true } },
    },
  });

  if (!caseData) {
    return new Response(JSON.stringify({ error: "Case not found" }), {
      status: 404,
    });
  }

  const totalBilled = caseData.billingRecords.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );
  const totalPaid = caseData.billingRecords.reduce(
    (sum, b) => sum + Number(b.paidAmount),
    0
  );

  const pendingDeadlines = caseData.deadlines.filter(
    (d) => d.status === "PENDING"
  );
  const overdueDeadlines = caseData.deadlines.filter(
    (d) => d.status === "OVERDUE"
  );

  const caseContext = `
CASE INFORMATION:
- Case Number: ${caseData.caseNumber}
- Title: ${caseData.title}
- Type: ${caseData.caseType}
- Status: ${caseData.status}
- Priority: ${caseData.priority}
- Filed: ${caseData.createdAt.toISOString().split("T")[0]}
- Description: ${caseData.description || "Not provided"}
- Notes: ${caseData.notes || "None"}

CLIENT:
- Name: ${caseData.client.name}
- Type: ${caseData.client.clientType}
- Email: ${caseData.client.email}
- Company: ${caseData.client.company || "N/A"}

DEADLINES (${caseData.deadlines.length} total, ${pendingDeadlines.length} pending, ${overdueDeadlines.length} overdue):
${caseData.deadlines.map((d) => `  - ${d.title} | Due: ${d.dueDate.toISOString().split("T")[0]} | Status: ${d.status} | Priority: ${d.priority}`).join("\n") || "  None"}

BILLING (${caseData.billingRecords.length} invoices, Total: $${totalBilled.toFixed(2)}, Paid: $${totalPaid.toFixed(2)}):
${caseData.billingRecords.map((b) => `  - ${b.invoiceNumber}: $${Number(b.totalAmount).toFixed(2)} (${b.paymentStatus})`).join("\n") || "  None"}
  `.trim();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a senior legal assistant AI for a law practice management system called LawFlow. Generate a concise, professional case brief summary. Structure your response with these sections:

## Case Overview
Brief 2-3 sentence overview of the case.

## Key Details
Bullet points covering client, case type, current status, and priority.

## Deadlines & Timeline
Summary of upcoming and overdue deadlines. Flag any urgent items.

## Financial Summary
Overview of billing status including outstanding amounts.

## Recommendations
2-3 actionable next steps based on the current case state.

Keep the tone professional and suitable for a legal practice. Be concise but thorough.`,
    prompt: caseContext,
  });

  return result.toTextStreamResponse();
}
