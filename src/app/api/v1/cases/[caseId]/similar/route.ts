import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { caseEmbeddingText, embedText, embedBatch, cosineSimilarity, hasEmbeddingKey } from "@/lib/embeddings";

export const runtime = "nodejs";

const CANDIDATE_FIELDS = {
  id: true, caseNumber: true, title: true, caseType: true, status: true,
  description: true, notes: true, embedding: true,
  client: { select: { name: true } },
} as const;

const MAX_BACKFILL = 100; // cap embeddings computed per request

/** Find the firm's own matters most similar to this one (semantic, in-app cosine). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const firmId = ctx.firmId;

  const query = await prisma.case.findFirst({ where: { id: caseId, firmId }, select: CANDIDATE_FIELDS });
  if (!query) return errorResponse("Matter not found", 404);

  if (!hasEmbeddingKey()) {
    return successResponse({ results: [], unavailable: true });
  }

  // 1) Ensure the query matter is embedded.
  let queryVec = query.embedding;
  if (!queryVec?.length) {
    const vec = await embedText(caseEmbeddingText({ ...query, clientName: query.client?.name }));
    if (!vec) return errorResponse("Could not embed this matter", 502);
    queryVec = vec;
    await prisma.case.update({ where: { id: query.id }, data: { embedding: vec, embeddedAt: new Date() } });
  }

  // 2) Load candidates (other firm matters).
  const candidates = await prisma.case.findMany({
    where: { firmId, id: { not: caseId } },
    select: CANDIDATE_FIELDS,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  // 3) Self-healing backfill: embed any candidates missing a vector (one batched call).
  const missing = candidates.filter((c) => !c.embedding?.length).slice(0, MAX_BACKFILL);
  if (missing.length) {
    const vecs = await embedBatch(missing.map((c) => caseEmbeddingText({ ...c, clientName: c.client?.name })));
    await Promise.all(
      missing.map((c, i) =>
        vecs[i]
          ? prisma.case.update({ where: { id: c.id }, data: { embedding: vecs[i], embeddedAt: new Date() } }).then(() => { c.embedding = vecs[i]; })
          : Promise.resolve()
      )
    );
  }

  // 4) Rank by cosine similarity.
  const results = candidates
    .filter((c) => c.embedding?.length)
    .map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      caseType: c.caseType,
      status: c.status,
      clientName: c.client?.name ?? null,
      similarity: Math.round(cosineSimilarity(queryVec!, c.embedding) * 100),
      sharedType: c.caseType === query.caseType,
    }))
    .filter((r) => r.similarity >= 40) // drop weak matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);

  return successResponse({ results, totalSearched: candidates.length });
}
