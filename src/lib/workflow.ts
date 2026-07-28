import { prisma } from "@/lib/prisma";
import type { Priority, TaskStatus } from "@prisma/client";
import { immigrationEvidenceChecklist } from "@/lib/practice-areas/immigration";

/**
 * Workflow engine — instantiates a practice-area workflow template into real
 * Tasks on a matter, with relative deadlines, assignment, and approval gates.
 * This is what turns the app from a filing cabinet into operational infrastructure.
 *
 * Not yet automated here (clearly-scoped follow-ons): automated email/SMS
 * (needs a comms provider), overdue escalation (a scheduled job), and analytics.
 */

export type WorkflowStepType = "TASK" | "APPROVAL" | "EMAIL" | "SMS" | "DOCUMENT" | "WAIT";

export interface WorkflowStep {
  key: string;
  title: string;
  description?: string;
  type: WorkflowStepType;
  offsetDays: number;            // due relative to matter-open date
  priority?: Priority;
  requiresApproval?: boolean;
  assigneeRole?: string;         // informational until role-based routing lands
  condition?: string;            // informational (conditional steps)
}

/** Create a Task per actionable step with relative deadlines. Returns count. */
export async function instantiateWorkflow(input: {
  firmId: string;
  caseId: string;
  steps: WorkflowStep[];
  openDate?: Date;
  defaultAssigneeId?: string | null;
}): Promise<number> {
  const base = input.openDate?.getTime() ?? Date.now();
  const instanceId = `wf_${input.caseId}_${base}`;
  // WAIT steps are timers only; everything else becomes a task.
  const actionable = input.steps.filter((s) => s.type !== "WAIT");
  if (!actionable.length) return 0;

  await prisma.task.createMany({
    data: actionable.map((s, i) => ({
      firmId: input.firmId,
      caseId: input.caseId,
      title: s.title,
      description: s.description ?? null,
      status: (s.requiresApproval ? "WAITING_APPROVAL" : "TODO") as TaskStatus,
      priority: (s.priority ?? "MEDIUM") as Priority,
      dueDate: new Date(base + s.offsetDays * 86_400_000),
      requiresApproval: s.requiresApproval ?? false,
      stepKey: s.key,
      workflowInstanceId: instanceId,
      order: i,
      assigneeId: input.defaultAssigneeId ?? null,
    })),
  });
  return actionable.length;
}

/** Built-in immigration matter workflow (the beachhead vertical). */
export function immigrationWorkflowSteps(): WorkflowStep[] {
  return [
    { key: "assign_team", title: "Assign responsible attorney & paralegal", type: "TASK", offsetDays: 0, priority: "HIGH" },
    { key: "request_docs", title: "Request client documents", description: `Send the client the evidence checklist: ${immigrationEvidenceChecklist().join("; ")}.`, type: "DOCUMENT", offsetDays: 1 },
    { key: "confirm_eligibility", title: "Confirm eligibility & correct form/category", type: "TASK", offsetDays: 2, priority: "HIGH" },
    { key: "collect_evidence", title: "Collect & review supporting evidence", type: "TASK", offsetDays: 10 },
    { key: "prepare_petition", title: "Prepare petition / application", type: "TASK", offsetDays: 18 },
    { key: "attorney_review", title: "Attorney review & sign-off before filing", type: "APPROVAL", offsetDays: 21, requiresApproval: true, priority: "HIGH" },
    { key: "confirm_fees", title: "Confirm current filing fee & lockbox/address", type: "TASK", offsetDays: 21 },
    { key: "file", title: "File with USCIS/EOIR", type: "TASK", offsetDays: 25, priority: "HIGH" },
    { key: "calendar_followup", title: "Calendar receipt notice & biometrics follow-up", type: "TASK", offsetDays: 35 },
  ];
}

/** Return the built-in workflow for a matter type, if one exists. */
export function builtInWorkflowFor(caseType: string): WorkflowStep[] | null {
  if (caseType === "IMMIGRATION") return immigrationWorkflowSteps();
  return null;
}
