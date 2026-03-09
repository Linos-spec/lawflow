import { z } from "zod";

export const createDeadlineSchema = z.object({
  title: z.string().min(1, "Deadline title is required"),
  caseId: z.string().min(1, "Related case is required"),
  dueDate: z.string().min(1, "Due date is required"),
  deadlineType: z.enum([
    "FILING", "COURT_APPEARANCE", "DISCOVERY",
    "STATUTE_OF_LIMITATIONS", "CLIENT_MEETING", "INTERNAL", "OTHER",
  ]).default("OTHER"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  description: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateDeadlineInput = z.infer<typeof createDeadlineSchema>;
