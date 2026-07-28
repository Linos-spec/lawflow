import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Multilingual intake — a prospect writes in their own language, the firm reads
 * English. Best-effort: returns null if there's no AI key so the original text
 * is kept unchanged. Preserves names, dates, and places.
 */
export async function translateToEnglish(text: string): Promise<string | null> {
  if (!text?.trim()) return null;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-placeholder")) return null;
  try {
    const { text: out } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a professional legal translator. Translate the message into clear, natural English. Output ONLY the translation — no commentary, no quotes. Preserve names, dates, places, and legal meaning exactly.",
      prompt: text.slice(0, 8000),
    });
    return out?.trim() || null;
  } catch (err) {
    console.error("Intake translation failed:", err);
    return null;
  }
}

// Languages offered on the public intake form (label shown to the prospect).
export const INTAKE_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ht", label: "Kreyòl Ayisyen" },
  { code: "hi", label: "हिन्दी" },
];
