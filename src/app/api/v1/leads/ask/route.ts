import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { anthropicComplete, aiConfigured } from "@/lib/ai-rest";
import { CASE_TYPE_LABELS } from "@/lib/constants";
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/lead-badges";

export const runtime = "nodejs";

interface Msg { role: "user" | "assistant"; content: string }

const SYSTEM = `You are Linoscore AI, helping a law firm's intake team triage and act on its leads. You are given a snapshot of the firm's current leads (most recent first). Answer the user's question using ONLY this snapshot.

Be concise, specific, and practical:
- Prioritize by time-waiting (new, unanswered), AI qualification score, and conflicts.
- Flag any lead with a potential/confirmed conflict as needing clearance before intake proceeds.
- When asked, draft short, professional text: call-prep notes, an acknowledgement email to a prospect, or a next-step checklist. Keep drafts brief and mark them as drafts for the attorney to review and send.
- Refer to leads by name. If the snapshot doesn't contain the answer, say so plainly.

Never give legal advice to a prospective client, and never state that representation has begun. Drafts are decision-support for the attorney, not legal advice.`;

/** Answer a question grounded in the firm's current leads. */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  let body: { messages?: Msg[] };
  try { body = await req.json(); } catch { return json({ reply: "Sorry, something went wrong — try again?" }); }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return json({ reply: "Ask me anything about your leads — who needs a response, which conflicts to clear, or ask me to draft call notes." });
  }
  if (!aiConfigured()) {
    return json({ reply: "AI isn't configured on this deployment yet, so I can't answer right now." });
  }

  const leads = await prisma.lead.findMany({
    where: { firmId: ctx.firmId },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { assignedTo: { select: { name: true } } },
  });

  const snapshot = leads.map((l) => {
    const received = new Date(l.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const summary = (l.aiSummary || l.description || "").replace(/\s+/g, " ").slice(0, 160);
    return `- ${l.name} | matter: ${CASE_TYPE_LABELS[l.caseType] || l.caseType} | stage: ${STAGE_LABELS[l.stage] || l.stage} | AI score: ${l.qualificationScore ?? "not scored"} | conflict: ${l.conflictStatus} | source: ${SOURCE_LABELS[l.source] || l.source} | received: ${received} | owner: ${l.assignedTo?.name || "Unassigned"} | key dates: ${l.importantDates || "none"}${l.adverseParties?.length ? ` | opposing: ${l.adverseParties.join(", ")}` : ""} | notes: ${summary || "—"}`;
  }).join("\n");

  const context = leads.length
    ? `Current leads snapshot (${leads.length}):\n${snapshot}`
    : "The firm has no leads yet.";
  const transcript = messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  const prompt = `${context}\n\n---\n${transcript}\nAssistant:`;

  try {
    const reply = await anthropicComplete({ system: SYSTEM, prompt, maxTokens: 700 });
    return json({ reply: reply || "I couldn't find anything useful for that — try rephrasing?" });
  } catch {
    return json({ reply: "I hit a snag answering that. Please try again." });
  }
}

function json(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "Content-Type": "application/json" } });
}
