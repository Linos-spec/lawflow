import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { documentAnalysisSchema, type DocumentAnalysis } from "@/lib/validators/ai.schema";

/**
 * AI organization for an uploaded document: classifies type, proposes a clean
 * title, extracts parties, and auto-tags — from the extracted text.
 * Best-effort: returns null if there's no text or no AI key configured.
 */
export async function organizeDocument(input: {
  originalName: string;
  extractedText: string;
}): Promise<DocumentAnalysis | null> {
  const text = input.extractedText?.trim();
  if (!text) return null; // nothing to analyze (e.g. scanned doc with no OCR)
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-placeholder")) {
    return null;
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: documentAnalysisSchema,
      system: `You are a legal document classifier for Linos Legal. Analyze the document text and organize it: determine its type, propose a consistent professional title, list the parties, and add useful tags. Be concise and accurate.`,
      prompt: `Original file name: ${input.originalName}\n\nDocument text (may be truncated):\n${text.slice(0, 12_000)}`,
    });
    return object;
  } catch (err) {
    console.error("Document organization failed:", err);
    return null;
  }
}
