import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

export const runtime = "nodejs";

// Public — no auth. Access is gated by the unguessable token.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sr = await prisma.signatureRequest.findUnique({
    where: { token },
    include: { document: { select: { id: true, title: true } }, firm: { select: { name: true } } },
  });
  if (!sr) return errorResponse("Signing link not found", 404);

  const expired = sr.expiresAt ? sr.expiresAt.getTime() < Date.now() : false;
  return successResponse({
    status: expired && sr.status === "PENDING" ? "EXPIRED" : sr.status,
    signerName: sr.signerName,
    documentTitle: sr.document.title,
    firmName: sr.firm.name,
    signedAt: sr.signedAt,
  });
}

const signSchema = z.object({
  signatureData: z.string().min(1),      // the signer types their full legal name
  consent: z.literal(true),              // must affirmatively consent
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sr = await prisma.signatureRequest.findUnique({ where: { token } });
  if (!sr) return errorResponse("Signing link not found", 404);
  if (sr.status !== "PENDING") return errorResponse("This document has already been signed or is no longer available", 409);
  if (sr.expiresAt && sr.expiresAt.getTime() < Date.now()) return errorResponse("This signing link has expired", 410);

  let input: z.infer<typeof signSchema>;
  try {
    input = signSchema.parse(await request.json());
  } catch {
    return errorResponse("Type your full name and check the consent box to sign", 400);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const ua = request.headers.get("user-agent") || null;
  const nowIso = new Date().toISOString();
  const trail = Array.isArray(sr.auditTrail) ? sr.auditTrail : [];

  await prisma.$transaction([
    prisma.signatureRequest.update({
      where: { id: sr.id },
      data: {
        status: "SIGNED",
        signatureData: input.signatureData,
        signatureType: "typed",
        consent: true,
        signedAt: new Date(),
        signerIp: ip,
        signerUserAgent: ua,
        auditTrail: [...trail, { event: "signed", at: nowIso, ip, ua, name: input.signatureData }],
      },
    }),
    prisma.document.update({ where: { id: sr.documentId }, data: { signatureStatus: "SIGNED" } }),
  ]);

  return successResponse({ signed: true, signedAt: nowIso });
}
