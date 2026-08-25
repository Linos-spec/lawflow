import { NextRequest } from "next/server";
import { generateText } from "ai";
import { aiModel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createDocument } from "@/lib/document-pipeline";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().min(1),
  guidance: z.string().optional().default(""),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "document";
}

/**
 * One-click drafting from AI Case Intelligence: takes a recommended document,
 * generates a full draft grounded in the matter, and files it as a Document on
 * the case (via the Phase D pipeline, so it's searchable/versioned/tagged).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith("sk-placeholder")) {
    return errorResponse("AI drafting requires an OpenAI key", 503);
  }

  let input: z.infer<typeof bodySchema>;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return errorResponse("title is required", 400);
  }

  const c = await prisma.case.findFirst({
    where: { id: caseId, firmId: ctx.firmId },
    include: { client: true, deadlines: { orderBy: { dueDate: "asc" }, take: 15 } },
  });
  if (!c) return errorResponse("Case not found", 404);

  const context = `
MATTER:
- Case Number: ${c.caseNumber}
- Title: ${c.title}
- Type: ${c.caseType}
- Status: ${c.status}
- Description: ${c.description || "Not provided"}
- Notes: ${c.notes || "None"}

CLIENT:
- Name: ${c.client.name}
- Type: ${c.client.clientType}
- Company: ${c.client.company || "N/A"}

DEADLINES:
${c.deadlines.map((d) => `  - ${d.title} | Due ${d.dueDate.toISOString().split("T")[0]}`).join("\n") || "  None"}
`.trim();

  try {
    const { text } = await generateText({
      model: aiModel,
      system: `You are a senior legal drafting assistant for Linoscore Legal. Draft a complete, professional "${input.title}" for the matter below.${input.guidance ? ` Purpose/context: ${input.guidance}.` : ""}
Rules:
- Produce a full working draft, properly formatted for the document type.
- Use [BRACKETED PLACEHOLDERS] for anything requiring attorney input or facts not provided.
- Do not invent case citations or statutes; if legal authority is needed, insert a [CITE: ...] placeholder for the attorney to fill.
- This is an attorney work product for review — not legal advice.`,
      prompt: context,
    });

    const body = `# ${input.title}\n\n> AI-generated draft for ${c.title} (${c.caseNumber}). Attorney review required before use.\n\n${text}`;
    const doc = await createDocument({
      firmId: ctx.firmId,
      buffer: Buffer.from(body, "utf8"),
      fileName: `${slugify(input.title)}.md`,
      mimeType: "text/markdown",
      title: input.title,
      caseId: c.id,
      clientId: c.clientId,
      uploadedBy: ctx.userId,
    });

    return successResponse({ id: doc.id, title: doc.title }, 201);
  } catch (error) {
    console.error("Draft document error:", error);
    return errorResponse("Failed to draft document", 500);
  }
}
