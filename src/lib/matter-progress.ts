import { prisma } from "@/lib/prisma";

/**
 * The client-facing progress view:
 *   Intake complete → Documents received → Filing prepared → Filed → Awaiting response
 * Derived from real matter data (documents, workflow tasks, courier filings,
 * case status) — no manual status-keeping.
 */

export interface ProgressStage {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
}

const STAGES: { key: string; label: string }[] = [
  { key: "intake", label: "Intake complete" },
  { key: "documents", label: "Documents received" },
  { key: "prepared", label: "Filing prepared" },
  { key: "filed", label: "Filed" },
  { key: "response", label: "Awaiting response" },
];

const FILED_RE = /delivered|filed|completed/i;

export async function computeMatterProgress(caseId: string, firmId: string): Promise<{
  stages: ProgressStage[];
  currentLabel: string;
  closed: boolean;
} | null> {
  const matter = await prisma.case.findFirst({
    where: { id: caseId, firmId },
    select: {
      status: true,
      filingDate: true,
      _count: { select: { documents: true } },
      tasks: { select: { stepKey: true, status: true } },
      deliveryRequests: { select: { status: true } },
    },
  });
  if (!matter) return null;

  const hasDocs = matter._count.documents > 0;
  const preparedDone = matter.tasks.some((t) => (t.stepKey === "prepare_petition" || t.stepKey === "file") && t.status === "DONE");
  const filed =
    matter.deliveryRequests.some((d) => FILED_RE.test(d.status)) ||
    matter.tasks.some((t) => t.stepKey === "file" && t.status === "DONE") ||
    !!matter.filingDate;
  const closed = ["CLOSED", "ARCHIVED"].includes(matter.status);

  let current = 0;                 // Intake complete — always reached once a matter exists
  if (hasDocs) current = 1;        // Documents received
  if (preparedDone) current = 2;   // Filing prepared
  if (filed) current = 4;          // Filed → Awaiting response

  const stages: ProgressStage[] = STAGES.map((s, i) => ({
    ...s,
    done: i < current || (closed && true),
    current: i === current && !closed,
  }));

  return {
    stages,
    currentLabel: closed ? "Matter closed" : STAGES[current].label,
    closed,
  };
}
