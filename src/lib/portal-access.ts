import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/** Hash a portal PIN, salted with the matter's token so hashes aren't portable. */
export function hashPin(token: string, pin: string): string {
  return createHash("sha256").update(`${token}:${pin}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
}

export interface PortalMatter {
  id: string;
  firmId: string;
  title: string;
  caseNumber: string;
}

export type PortalAccess =
  | { ok: true; matter: PortalMatter; hasPin: boolean }
  | { ok: false; reason: "not_found" | "expired" | "pin_required" | "pin_invalid" };

/**
 * Resolve access to a portal by token, enforcing expiry and (optional) PIN.
 * `pin` comes from the x-portal-pin request header. Shared by every public
 * portal route so the gate is enforced consistently.
 */
export async function resolvePortalAccess(token: string, pin: string | null): Promise<PortalAccess> {
  const matter = await prisma.case.findFirst({
    where: { portalToken: token, portalEnabled: true },
    select: { id: true, firmId: true, title: true, caseNumber: true, portalPinHash: true, portalExpiresAt: true },
  });
  if (!matter) return { ok: false, reason: "not_found" };

  if (matter.portalExpiresAt && matter.portalExpiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (matter.portalPinHash) {
    if (!pin) return { ok: false, reason: "pin_required" };
    if (!safeEqualHex(hashPin(token, pin), matter.portalPinHash)) return { ok: false, reason: "pin_invalid" };
  }

  return {
    ok: true,
    hasPin: !!matter.portalPinHash,
    matter: { id: matter.id, firmId: matter.firmId, title: matter.title, caseNumber: matter.caseNumber },
  };
}
