import { prisma } from "@/lib/prisma";

/**
 * Append one entry to the firm's audit trail. Best-effort and non-throwing —
 * an audit failure must never break the underlying action. The actor's name is
 * snapshotted so the record stays meaningful even if the user is later removed.
 */
export async function logAudit(input: {
  firmId: string;
  userId?: string | null;
  action: string;              // dotted verb, e.g. "case.delete"
  category?: "data" | "access" | "auth" | "config";
  entity: string;             // e.g. "Case", "Client", "Document"
  entityId: string;
  entityLabel?: string | null; // human-readable snapshot
  details?: string | null;
}): Promise<void> {
  try {
    let actorName = "System";
    if (input.userId) {
      const u = await prisma.user.findUnique({ where: { id: input.userId }, select: { name: true } });
      actorName = u?.name || "Unknown user";
    }
    await prisma.auditLog.create({
      data: {
        firmId: input.firmId,
        userId: input.userId ?? null,
        actorName,
        action: input.action,
        category: input.category ?? "data",
        entity: input.entity,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? null,
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error("audit log failed:", err);
  }
}
