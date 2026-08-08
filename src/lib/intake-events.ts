import { prisma } from "@/lib/prisma";
import type { IntakeStatus } from "@/lib/intake";

type Client = typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Append one entry to an intake's audit trail. */
export async function logIntakeEvent(
  client: Client,
  data: {
    leadId: string;
    firmId: string;
    type: string;
    actorLabel: string;
    actorId?: string | null;
    fromStatus?: IntakeStatus | null;
    toStatus?: IntakeStatus | null;
    note?: string | null;
  },
) {
  await client.intakeEvent.create({
    data: {
      leadId: data.leadId,
      firmId: data.firmId,
      type: data.type,
      actorLabel: data.actorLabel,
      actorId: data.actorId ?? null,
      fromStatus: data.fromStatus ?? null,
      toStatus: data.toStatus ?? null,
      note: data.note ?? null,
    },
  });
}
