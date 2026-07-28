import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email().optional().or(z.literal("")),
});

/** Create a signature request for a document and return the public signing link. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { docId } = await params;

  const doc = await prisma.document.findFirst({ where: { id: docId, firmId: ctx.firmId }, select: { id: true } });
  if (!doc) return errorResponse("Document not found", 404);

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return errorResponse("A signer name is required", 400);
  }

  const nowIso = new Date().toISOString();
  const sr = await prisma.signatureRequest.create({
    data: {
      firmId: ctx.firmId,
      documentId: docId,
      signerName: input.signerName,
      signerEmail: input.signerEmail || null,
      status: "PENDING",
      createdBy: ctx.userId,
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
      auditTrail: [{ event: "created", at: nowIso, by: ctx.userId }],
    },
  });

  await prisma.document.update({ where: { id: docId }, data: { signatureStatus: "PENDING" } });

  const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  return successResponse({ id: sr.id, token: sr.token, signingUrl: `${origin}/sign/${sr.token}` }, 201);
}
