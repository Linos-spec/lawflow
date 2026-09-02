import { NextRequest } from "next/server";
import { anthropicComplete, aiConfigured } from "@/lib/ai-rest";

export const runtime = "nodejs";

/**
 * Public marketing / discovery assistant ("Wilson"). Answers prospective-customer
 * questions about Linoscore Legal and routes them to a trial, demo, or sales.
 * Unauthenticated and product-scoped — it never touches firm data. (MVP: add
 * per-IP rate limiting before heavy production use — it spends AI tokens.)
 */

const SYSTEM = `You are Wilson, the friendly AI assistant on the marketing website of Linoscore Legal.
Linoscore Legal is AI-powered legal practice-management software for law firms (focused on immigration and small firms), operated by Linos LLC (Allen, Texas). It's positioned as "the AI employee for law firms."

What it does:
- AI modules: 24/7 AI client intake, automated conflict checks, AI qualification with a retainer recommendation, automatic engagement letters, AI case intelligence, and court filing with proof (via Linoscore Delivery).
- Core practice management: cases/matters, clients, documents, deadlines & calendar, billing & invoicing, and a secure client portal.
- Works alongside tools like Clio, MyCase, or PracticePanther — a firm can start with intake only, import matters by CSV, and keep their current system. No forced migration.

Pricing: $29 per user/month as an introductory rate for new firms — for the first 6 months — then $49 per user/month. There's a 14-day free trial and no credit card required to start.

Security (firms can read the full Trust Center at /trust): data hosted in the US, encrypted in transit and at rest, tenant isolation, role-based access, two-factor authentication, an immutable audit log, and no use of client data to train AI models. A signed DPA is available on request.

Professional responsibility: AI output is decision-support only — nothing reaches a client without an attorney's review and approval. Linoscore Legal is software, not a law firm, and does not give legal advice.

How to respond:
- Be warm, concise, and genuinely helpful — 1 to 4 short sentences. Plain language.
- Only answer about Linoscore Legal and how it helps law firms. If asked something off-topic or something you can't verify, say so briefly and offer to connect them with the team.
- Never give legal advice. Never ask for sensitive client information, passwords, or payment details.
- When someone shows buying intent or asks for specifics (a demo, custom pricing, migration help), point them to the next step: start a free trial at /register, or email info@linosconsulting.com to book a discovery call.
- If someone is an existing customer: for billing, plan, invoices, or seats, tell them to sign in and open Settings → Plan & Billing; for technical/IT issues or training/how-to help, point them to info@linosconsulting.com.
- Don't invent features, customers, certifications, or numbers. If we don't have something (e.g., SOC 2 today), say it's on the roadmap.`;

interface Msg { role: "user" | "assistant"; content: string }

export async function POST(req: NextRequest) {
  let body: { messages?: Msg[] };
  try { body = await req.json(); } catch { return json({ reply: "Sorry, something went wrong — try again?" }); }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return json({ reply: "Ask me anything about Linoscore Legal!" });
  }

  if (!aiConfigured()) {
    return json({ reply: "I'm briefly offline — but I'd love to help. Start a free 14-day trial at /register, or email info@linosconsulting.com to book a discovery call." });
  }

  // Flatten the short transcript into a single prompt for the assistant's next turn.
  const transcript = messages.map((m) => `${m.role === "user" ? "Prospect" : "Wilson"}: ${m.content}`).join("\n");
  const prompt = `${transcript}\nWilson:`;

  try {
    const reply = await anthropicComplete({ system: SYSTEM, prompt, maxTokens: 400 });
    return json({ reply: reply || "Happy to help — could you rephrase that?" });
  } catch {
    return json({ reply: "I hit a snag. For anything specific, email info@linosconsulting.com or start a free trial at /register." });
  }
}

function json(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}
