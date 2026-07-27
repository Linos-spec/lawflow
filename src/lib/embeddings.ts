import { embedMany, embed as aiEmbed } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Semantic embeddings for similar-matter search. Uses OpenAI text-embedding-3-small
 * (1536-dim, cheap). Vectors are stored as Float[] on Case and ranked in-app by
 * cosine similarity — no vector database needed at a firm's matter volume.
 */

const MODEL = "text-embedding-3-small";

export function hasEmbeddingKey() {
  return !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-placeholder");
}

/** Build the text to embed for a matter from its salient facts. */
export function caseEmbeddingText(c: {
  title?: string | null;
  caseType?: string | null;
  description?: string | null;
  notes?: string | null;
  clientName?: string | null;
}): string {
  return [
    c.title && `Title: ${c.title}`,
    c.caseType && `Type: ${c.caseType.replace(/_/g, " ").toLowerCase()}`,
    c.clientName && `Client: ${c.clientName}`,
    c.description && `Facts: ${c.description}`,
    c.notes && `Notes: ${c.notes}`,
  ].filter(Boolean).join("\n").slice(0, 8000);
}

/** Embed a single string. Returns null without an AI key. */
export async function embedText(text: string): Promise<number[] | null> {
  if (!hasEmbeddingKey() || !text.trim()) return null;
  try {
    const { embedding } = await aiEmbed({ model: openai.embedding(MODEL), value: text });
    return embedding;
  } catch (err) {
    console.error("embedText failed:", err);
    return null;
  }
}

/** Embed many strings in one call (batched). Returns [] without a key. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!hasEmbeddingKey() || texts.length === 0) return [];
  try {
    const { embeddings } = await embedMany({ model: openai.embedding(MODEL), values: texts });
    return embeddings;
  } catch (err) {
    console.error("embedBatch failed:", err);
    return [];
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
