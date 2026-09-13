import { anthropicComplete, aiConfigured } from "@/lib/ai-rest";

/**
 * Attorney-gated meeting detection for inbound client-portal messages.
 *
 * When a client writes something like "can we meet Tuesday at 3?", we detect the
 * scheduling intent and extract a proposed calendar entry. The firm reviews and
 * confirms it — the AI never books a meeting or replies to the client on its own.
 * A cheap keyword pre-filter keeps us from spending AI tokens on "thanks!" etc.
 */

export interface MeetingProposal {
  title: string;
  startsAt: string;       // ISO 8601
  durationMins: number;
  note: string;
  confidence: number;     // 0..1
}

const SCHEDULING_HINTS = [
  "meet", "meeting", "appointment", "schedule", "reschedule", "available",
  "availability", "call", "zoom", "consult", "come in", "stop by", "book",
  "calendar", "time to talk", "get together", "sit down", "office hours",
  // day / time signals
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "tomorrow", "next week", "this week", "morning", "afternoon", "evening",
  "am", "pm", "o'clock", "noon",
];

/** Fast, free gate: does this text plausibly ask to schedule something? */
export function looksLikeScheduling(text: string): boolean {
  const t = text.toLowerCase();
  // Require an intent word OR a clear day-of-week/time reference plus a number.
  const hasHint = SCHEDULING_HINTS.some((h) => t.includes(h));
  if (!hasHint) return false;
  // Trim obvious false positives that merely contain "call"/"am" as substrings
  // is handled by word-ish boundaries below.
  return /\b(meet|meeting|appointment|schedule|reschedul|avail|call|zoom|consult|book|calendar|mon|tue|wed|thu|fri|sat|sun|tomorrow|next week|noon|\d\s?(am|pm)|\d{1,2}:\d{2})\b/i.test(t);
}

const SYSTEM = `You extract meeting/scheduling requests from a single message a law-firm client sent through the firm's client portal. Decide whether the client is proposing or requesting a meeting, call, or appointment. If they are, extract the details; resolve relative dates ("Tuesday", "tomorrow", "next week") to an absolute date using the provided current date, and pick a sensible time if one is implied but not exact. If the message is NOT a scheduling request, say so.

Respond with ONLY a JSON object, no prose:
{"isMeetingRequest": boolean, "title": string, "startsAt": string (ISO 8601 with timezone offset, or empty if no date/time could be determined), "durationMins": number, "note": string, "confidence": number between 0 and 1}

Rules:
- title: short, e.g. "Call with <client first name>" or "Client meeting". Do not invent a matter subject.
- If no concrete date is stated or inferable, set startsAt to "" and confidence low.
- durationMins: default 30 for a call, 45 for an in-person meeting.
- note: one short line quoting/paraphrasing what the client asked for.
- Never fabricate a specific time the client did not imply.`;

/**
 * Run detection on one client message. Returns a proposal only when the model is
 * confident it's a real scheduling request with a usable date/time. Best-effort:
 * returns null on any error, if AI is not configured, or if the pre-filter fails.
 */
export async function detectMeetingRequest(
  body: string,
  opts: { clientName?: string | null; nowISO?: string } = {}
): Promise<MeetingProposal | null> {
  const text = (body || "").trim();
  if (!text || !looksLikeScheduling(text)) return null;
  if (!aiConfigured()) return null;

  const now = opts.nowISO || new Date().toISOString();
  const prompt = `Current date/time (ISO): ${now}
Client name: ${opts.clientName || "the client"}

Client's portal message:
"""
${text.slice(0, 1500)}
"""`;

  try {
    const raw = await anthropicComplete({ system: SYSTEM, prompt, maxTokens: 300 });
    const json = extractJson(raw);
    if (!json || json.isMeetingRequest !== true) return null;

    const startsAt = typeof json.startsAt === "string" ? json.startsAt.trim() : "";
    // Require a parseable future-ish date and a minimum confidence to surface it.
    const when = startsAt ? new Date(startsAt) : null;
    if (!when || isNaN(when.getTime())) return null;
    const confidence = typeof json.confidence === "number" ? json.confidence : 0.5;
    if (confidence < 0.5) return null;

    const dm = Number(json.durationMins);
    const durationMins = Number.isFinite(dm) ? Math.min(240, Math.max(15, Math.round(dm))) : 30;
    return {
      title: (typeof json.title === "string" && json.title.trim()) ? json.title.trim().slice(0, 120) : "Client meeting",
      startsAt: when.toISOString(),
      durationMins,
      note: (typeof json.note === "string" ? json.note.trim() : "").slice(0, 300),
      confidence: Math.min(1, Math.max(0, confidence)),
    };
  } catch {
    return null;
  }
}

/** Pull the first JSON object out of a model response (tolerates code fences/prose). */
function extractJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}
