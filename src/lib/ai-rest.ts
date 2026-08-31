/**
 * Direct Anthropic Messages API — no @ai-sdk/* dependency, so it can't be broken
 * by AI-SDK version skew (which was crashing the SDK-based routes with a fast
 * 504). Used by the non-streaming AI features (summarize, draft, etc.).
 */

export const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-5";

export function aiConfigured(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && !k.startsWith("sk-placeholder") && !k.startsWith("placeholder");
}

/** One-shot completion. Returns the assistant text, or throws with the API error. */
export async function anthropicComplete(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        // Workspace-scoped / identity-linked keys require this header.
        ...(process.env.ANTHROPIC_WORKSPACE_ID ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } : {}),
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: opts.maxTokens ?? 2000,
        system: opts.system,
        messages: [{ role: "user", content: opts.prompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new Error(`Anthropic fetch failed: ${e instanceof Error ? e.name + " " + e.message : String(e)}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (json.content || []).filter((c) => c.type === "text").map((c) => c.text || "").join("").trim();
}
