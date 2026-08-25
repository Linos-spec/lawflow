import { generateObject } from "ai";
import { aiModel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { caseIntelligenceSchema, type CaseIntelligence } from "@/lib/validators/ai.schema";

function hasAiKey() {
  return !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-placeholder");
}

export type CaseContext = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  status: string;
  description: string | null;
  notes: string | null;
  clientName: string | null;
  documents: { title: string; documentType: string }[];
  deadlines: { title: string; dueDate: Date; status: string }[];
};

/** AI Case Intelligence — analytical fields. Best-effort; null without a key. */
export async function generateCaseIntelligence(c: CaseContext): Promise<CaseIntelligence | null> {
  if (!hasAiKey()) return null;
  const context = `
MATTER: ${c.title} (${c.caseNumber})
Type: ${c.caseType} · Status: ${c.status}
Client: ${c.clientName || "—"}
Description: ${c.description || "None provided"}
Notes: ${c.notes || "None"}
Documents on file (${c.documents.length}): ${c.documents.map((d) => `${d.title} [${d.documentType}]`).join("; ") || "none"}
Deadlines (${c.deadlines.length}): ${c.deadlines.map((d) => `${d.title} (${d.status})`).join("; ") || "none"}
  `.trim();

  try {
    const { object } = await generateObject({
      model: aiModel,
      schema: caseIntelligenceSchema,
      system: `You are a senior litigation strategist AI for Linoscore Legal. Analyze the matter and produce a candid strategic assessment for the supervising attorney.

Rules:
- Be specific to THIS matter's facts and type; avoid generic filler.
- Scores are your honest estimate, not guarantees.
- For statutes and case law: offer plausible starting points, but these are UNVERIFIED. Never fabricate confidence — the attorney will verify every citation in a legal database. If you are unsure a citation is real, prefer describing the doctrine over inventing a citation.
- Everything is decision-support for a licensed attorney, not legal advice.`,
      prompt: context,
    });
    return object;
  } catch (err) {
    console.error("Case intelligence generation failed:", err);
    return null;
  }
}

export type TimelineEvent = { date: string; label: string; kind: "case" | "filing" | "deadline" | "document" };
export type PriorMatter = { id: string; caseNumber: string; title: string; status: string; caseType: string };

/** Real, firm-owned data that shouldn't be left to the AI. */
export async function gatherCaseRealtimeData(caseRecord: {
  id: string; firmId: string; clientId: string; caseType: string;
  createdAt: Date; filingDate: Date | null; closingDate: Date | null;
}) {
  const [priorMatters, outstandingTasks, documents] = await Promise.all([
    prisma.case.findMany({
      where: {
        firmId: caseRecord.firmId,
        id: { not: caseRecord.id },
        OR: [{ caseType: caseRecord.caseType as never }, { clientId: caseRecord.clientId }],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, caseNumber: true, title: true, status: true, caseType: true },
    }),
    prisma.deadline.findMany({
      where: { caseId: caseRecord.id, status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, dueDate: true, status: true, priority: true, deadlineType: true },
    }),
    prisma.document.findMany({
      where: { caseId: caseRecord.id },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  // Build a real timeline from the matter's own dated records.
  const timeline: TimelineEvent[] = [
    { date: caseRecord.createdAt.toISOString(), label: "Matter opened", kind: "case" as const },
    ...(caseRecord.filingDate ? [{ date: caseRecord.filingDate.toISOString(), label: "Filed", kind: "filing" as const }] : []),
    ...(caseRecord.closingDate ? [{ date: caseRecord.closingDate.toISOString(), label: "Closed", kind: "case" as const }] : []),
    ...documents.map((d) => ({ date: d.createdAt.toISOString(), label: `Document: ${d.title}`, kind: "document" as const })),
    ...outstandingTasks.map((t) => ({ date: t.dueDate.toISOString(), label: `Deadline: ${t.title}`, kind: "deadline" as const })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return { priorMatters, outstandingTasks, timeline };
}
