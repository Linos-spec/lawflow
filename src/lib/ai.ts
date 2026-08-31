import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Central LLM model for Linoscore AI (Claude). One place to tune the model.
 * Override the id with the AI_MODEL env var without a code change.
 *
 * Note: the "Similar matters" feature uses OpenAI *embeddings* (see
 * embeddings.ts) because Anthropic has no embeddings API — that path stays on
 * OPENAI_API_KEY. Everything else (summaries, chat, drafting, intake
 * qualification, extraction) runs on Claude via ANTHROPIC_API_KEY.
 *
 * Workspace-scoped / identity-linked API keys require an `anthropic-workspace-id`
 * header on every request. Set ANTHROPIC_WORKSPACE_ID and we forward it.
 */
export const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-5";

export const anthropicHeaders: Record<string, string> = process.env.ANTHROPIC_WORKSPACE_ID
  ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
  : {};

const provider = createAnthropic({ headers: anthropicHeaders });
export const aiModel = provider(AI_MODEL);

/** True when a real Anthropic key is configured (not missing / placeholder). */
export function aiConfigured(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && !k.startsWith("sk-placeholder") && !k.startsWith("placeholder");
}
