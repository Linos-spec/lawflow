import { anthropicComplete, aiConfigured } from "@/lib/ai-rest";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  if (!aiConfigured()) {
    return new Response(JSON.stringify({ error: "AI is not configured. Add an ANTHROPIC_API_KEY to enable AI features.", notConfigured: true }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  const { caseId } = await req.json();
  if (!caseId) return new Response(JSON.stringify({ error: "caseId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });

  const caseData = await prisma.case.findFirst({
    where: { id: caseId, firmId: ctx.firmId },
    include: { client: true, deadlines: { orderBy: { dueDate: "asc" } }, billingRecords: { include: { lineItems: true } } },
  });
  if (!caseData) return new Response(JSON.stringify({ error: "Case not found" }), { status: 404, headers: { "Content-Type": "application/json" } });

  const totalBilled = caseData.billingRecords.reduce((s, b) => s + Number(b.totalAmount), 0);
  const totalPaid = caseData.billingRecords.reduce((s, b) => s + Number(b.paidAmount), 0);
  const pending = caseData.deadlines.filter((d) => d.status === "PENDING");
  const overdue = caseData.deadlines.filter((d) => d.status === "OVERDUE");

  const caseContext = `
CASE INFORMATION:
- Case Number: ${caseData.caseNumber}
- Title: ${caseData.title}
- Type: ${caseData.caseType}
- Status: ${caseData.status}
- Priority: ${caseData.priority}
- Description: ${caseData.description || "Not provided"}
- Notes: ${caseData.notes || "None"}

CLIENT:
- Name: ${caseData.client.name}
- Type: ${caseData.client.clientType}
- Email: ${caseData.client.email}

DEADLINES (${caseData.deadlines.length} total, ${pending.length} pending, ${overdue.length} overdue):
${caseData.deadlines.map((d) => `  - ${d.title} | Due: ${d.dueDate.toISOString().split("T")[0]} | ${d.status} | ${d.priority}`).join("\n") || "  None"}

BILLING (${caseData.billingRecords.length} invoices, Total: $${totalBilled.toFixed(2)}, Paid: $${totalPaid.toFixed(2)}):
${caseData.billingRecords.map((b) => `  - ${b.invoiceNumber}: $${Number(b.totalAmount).toFixed(2)} (${b.paymentStatus})`).join("\n") || "  None"}
  `.trim();

  try {
    const text = await anthropicComplete({
      maxTokens: 1600,
      system: `You are a senior legal assistant for a practice-management system called Linos Legal. Write a concise, professional case brief with these markdown sections:

## Case Overview
2-3 sentences.

## Key Details
Bullet points: client, case type, status, priority.

## Deadlines & Timeline
Upcoming and overdue deadlines; flag urgent items.

## Financial Summary
Billing status and outstanding amounts.

## Recommendations
2-3 actionable next steps.

Base every statement on the supplied case data only. Professional tone.`,
      prompt: caseContext,
    });
    return new Response(JSON.stringify({ summary: text }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Summarize error:", err);
    return new Response(JSON.stringify({ error: "The AI service could not generate a summary. Please try again.", detail: String(err instanceof Error ? err.message : err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}
