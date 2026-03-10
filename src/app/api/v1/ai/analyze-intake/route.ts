import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { intakeAnalysisSchema } from "@/lib/validators/ai.schema";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function POST(req: Request) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { intakeId } = await req.json();
  if (!intakeId) {
    return errorResponse("intakeId is required", 400);
  }

  const intake = await prisma.intakeForm.findFirst({
    where: { id: intakeId, firmId: ctx.firmId },
  });

  if (!intake) {
    return errorResponse("Intake form not found", 404);
  }

  const intakeContext = `
INTAKE FORM DETAILS:
- Prospect Name: ${intake.prospectName}
- Email: ${intake.prospectEmail || "Not provided"}
- Phone: ${intake.prospectPhone || "Not provided"}
- Stated Case Type: ${intake.caseType || "Not specified"}
- Description: ${intake.description || "No description provided"}
- Notes: ${intake.notes || "None"}
- Current Status: ${intake.status}
- Conflict Check Done: ${intake.conflictCheck ? "Yes" : "No"}
- Engagement Letter: ${intake.engagementLetter ? "Signed" : "Not signed"}
- ID Verification: ${intake.idVerification ? "Verified" : "Not verified"}
- Submitted: ${intake.createdAt.toISOString().split("T")[0]}
  `.trim();

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: intakeAnalysisSchema,
      system: `You are a senior legal intake specialist AI for LawFlow, a law practice management system. Analyze the intake form and provide a structured assessment.

Be thorough but practical:
- Suggest the most appropriate case type based on the description (it may differ from what the prospect stated)
- Assess priority based on urgency indicators (deadlines, statute of limitations, safety concerns)
- Identify risk flags (potential conflicts, red flags, missing information, complex issues)
- Recommend concrete next steps (e.g., "Schedule initial consultation", "Run conflict check", "Request additional documentation")
- Determine if a conflict check is needed (usually yes for new prospects)
- Write a brief professional summary suitable for internal firm review`,
      prompt: intakeContext,
    });

    return successResponse(object);
  } catch {
    return errorResponse("Failed to analyze intake form", 500);
  }
}
