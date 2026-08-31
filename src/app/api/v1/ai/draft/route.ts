import { anthropicComplete, aiConfigured } from "@/lib/ai-rest";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { entitledOr402 } from "@/lib/entitlement";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const templatePrompts: Record<string, string> = {
  demand_letter: `Generate a professional demand letter based on the case details below. Include:
- Formal header with date, client name/address placeholders, and opposing party placeholders
- Clear statement of the claim and facts
- Legal basis for the demand
- Specific demand with deadline for response
- Consequences of non-compliance
- Professional closing
Use formal legal language appropriate for a demand letter.`,

  client_memo: `Generate a professional internal client memorandum based on the case details below. Include:
- TO/FROM/DATE/RE header block
- Executive summary paragraph
- Background facts section
- Legal analysis section
- Current status and upcoming deadlines
- Recommended actions with timeline
- Risk assessment
Keep the tone professional but accessible to the client.`,

  case_summary: `Generate a comprehensive case summary report based on the case details below. Include:
- Case identification header (number, type, status)
- Parties involved section
- Factual background
- Procedural history / timeline of events
- Current status and pending items
- Financial overview (billing, outstanding amounts)
- Key deadlines and upcoming dates
- Assessment and recommended next steps
Use a structured report format suitable for internal firm review.`,

  motion_draft: `Generate a draft motion based on the case details below. Include:
- Caption with case number and court placeholders
- Title of the motion
- Introduction paragraph
- Statement of facts
- Legal argument with numbered points
- Prayer for relief / conclusion
- Signature block placeholder
- Certificate of service placeholder
Use formal legal motion format and appropriate citations placeholders.`,
};

export async function POST(req: Request) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const _billBlock = await entitledOr402(ctx.firmId); if (_billBlock) return _billBlock;

  // 200 JSON (never 5xx) so DigitalOcean/Cloudflare doesn't swallow the body.
  if (!aiConfigured()) {
    return new Response(JSON.stringify({ error: "AI is not configured. Add an ANTHROPIC_API_KEY to enable document drafting.", notConfigured: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const { caseId, templateType } = await req.json();
  if (!caseId || !templateType) {
    return new Response(
      JSON.stringify({ error: "caseId and templateType are required" }),
      { status: 400 }
    );
  }

  const systemPrompt = templatePrompts[templateType];
  if (!systemPrompt) {
    return new Response(
      JSON.stringify({ error: "Invalid template type" }),
      { status: 400 }
    );
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

  const caseContext = `
CASE DETAILS:
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
- Phone: ${caseData.client.phone || "N/A"}
- Company: ${caseData.client.company || "N/A"}

DEADLINES:
${caseData.deadlines.map((d) => `  - ${d.title} | Due: ${d.dueDate.toISOString().split("T")[0]} | Status: ${d.status}`).join("\n") || "  None"}

BILLING (Total: $${totalBilled.toFixed(2)}):
${caseData.billingRecords.map((b) => {
  const items = b.lineItems.map((li) => `      ${li.description}: $${Number(li.amount).toFixed(2)}`).join("\n");
  return `  - ${b.invoiceNumber}: $${Number(b.totalAmount).toFixed(2)} (${b.paymentStatus})\n${items}`;
}).join("\n") || "  None"}
  `.trim();

  try {
    const text = await anthropicComplete({ system: systemPrompt, prompt: caseContext, maxTokens: 3000 });
    return new Response(JSON.stringify({ document: text }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Draft error:", err);
    return new Response(JSON.stringify({ aiError: true, error: "The AI service could not generate this document. Please try again.", detail: String(err instanceof Error ? err.message : err).slice(0, 300) }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}
