import { generateText } from "ai";
import { aiModel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { createDocument } from "@/lib/document-pipeline";
import { immigrationEngagementScope, immigrationEvidenceChecklist } from "@/lib/practice-areas/immigration";

function hasAiKey() {
  return !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-placeholder");
}

const STRUCTURE_LABELS: Record<string, string> = {
  HOURLY: "Hourly", FLAT_FEE: "Flat fee", CONTINGENCY: "Contingency",
};

function feeTerms(retainer?: { structure?: string | null; amountLow?: number | null; amountHigh?: number | null } | null): string {
  if (!retainer?.structure) return "Not specified — attorney to set";
  const money = (n?: number | null) => (n == null ? null : `$${n.toLocaleString("en-US")}`);
  const lo = money(retainer.amountLow), hi = money(retainer.amountHigh);
  const range = lo && hi ? (lo === hi ? lo : `${lo}–${hi}`) : lo || hi || "attorney to set";
  return `${STRUCTURE_LABELS[retainer.structure] || retainer.structure}, initial retainer ${range}`;
}

/** Draft engagement-letter text (Markdown). Best-effort — null without an AI key. */
export async function generateEngagementLetterText(input: {
  firmName: string;
  clientName: string;
  matterType: string;
  matterDescription?: string | null;
  retainer?: { structure?: string | null; amountLow?: number | null; amountHigh?: number | null } | null;
}): Promise<string | null> {
  if (!hasAiKey()) return null;
  // Immigration (beachhead vertical): inject standard scope + evidence expectations.
  const isImmigration = input.matterType?.toUpperCase() === "IMMIGRATION";
  const immigrationBlock = isImmigration
    ? `\n\nImmigration scope to reflect in the letter: ${immigrationEngagementScope()}\nRequired client-provided documents to list under client responsibilities: ${immigrationEvidenceChecklist().join("; ")}.`
    : "";
  try {
    const { text } = await generateText({
      model: aiModel,
      system: `You draft client engagement letters (retainer agreements) for the law firm "${input.firmName}". Produce a complete, professional letter in Markdown covering: the parties, scope of representation, the fee/retainer terms provided, billing and payment practices, client responsibilities, confidentiality, termination, and a signature block for client and attorney. Use standard, plain professional language. Use [bracketed placeholders] for anything not provided (effective date, addresses, hourly rates, jurisdiction). Begin with a one-line note: "DRAFT — for attorney review and finalization before sending." Do not present it as executed or as legal advice to the client.`,
      prompt: `Firm: ${input.firmName}
Client: ${input.clientName}
Matter type: ${input.matterType.replace(/_/g, " ").toLowerCase()}
Matter description: ${input.matterDescription || "Not provided"}
Fee/retainer terms: ${feeTerms(input.retainer)}${immigrationBlock}`,
    });
    return text?.trim() || null;
  } catch (err) {
    console.error("Engagement letter generation failed:", err);
    return null;
  }
}

/**
 * Generate an engagement letter and save it as a Document (type ENGAGEMENT_LETTER,
 * signature PENDING) linked to the client (and matter). Returns the doc or null.
 */
export async function createEngagementLetter(input: {
  firmId: string;
  firmName: string;
  clientId?: string | null;
  caseId?: string | null;
  clientName: string;
  matterType: string;
  matterDescription?: string | null;
  retainer?: { structure?: string | null; amountLow?: number | null; amountHigh?: number | null } | null;
  uploadedBy?: string | null;
}) {
  const text = await generateEngagementLetterText(input);
  if (!text) return null;

  const doc = await createDocument({
    firmId: input.firmId,
    buffer: Buffer.from(text, "utf8"),
    fileName: `Engagement Letter - ${input.clientName}.md`,
    mimeType: "text/markdown",
    title: `Engagement Letter — ${input.clientName}`,
    clientId: input.clientId,
    caseId: input.caseId ?? null,
    uploadedBy: input.uploadedBy ?? null,
  });

  // Pin the type + mark it as awaiting signature (overrides AI classification).
  return prisma.document.update({
    where: { id: doc.id },
    data: { documentType: "ENGAGEMENT_LETTER", signatureStatus: "PENDING" },
  });
}
