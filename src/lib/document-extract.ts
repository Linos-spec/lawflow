import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Extract searchable text from an uploaded document.
 * - PDFs: pull the embedded text layer (pdf-parse / pdf.js).
 * - Images: OCR via OpenAI vision (best-effort; skipped if no AI key).
 * - Plain text: decoded directly.
 * Always resolves — returns "" if nothing could be extracted.
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      return await extractPdf(buffer);
    }
    if (mimeType.startsWith("image/")) {
      return await ocrImage(buffer, mimeType);
    }
    if (mimeType.startsWith("text/") || mimeType === "application/json") {
      return buffer.toString("utf8").slice(0, 200_000);
    }
    // docx/xlsx and other office formats aren't parsed in the MVP.
    return "";
  } catch (err) {
    console.error("Text extraction failed:", err);
    return "";
  }
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2 exposes a PDFParse class. Imported dynamically so the heavy
  // pdf.js dependency only loads when a PDF is actually processed.
  const mod = await import("pdf-parse");
  const PDFParse = (mod as unknown as { PDFParse: new (o: { data: Uint8Array }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } }).PDFParse;
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function ocrImage(buffer: Buffer, mimeType: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-placeholder")) {
    return ""; // OCR needs the AI key; degrade gracefully.
  }
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe ALL text visible in this document image, preserving line breaks. Return only the transcribed text, nothing else." },
          { type: "image", image: new URL(dataUrl) },
        ],
      },
    ],
  });
  return (text || "").trim();
}
