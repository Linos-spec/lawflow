import { z } from "zod";

export const createCaseSchema = z.object({
  title: z.string().min(1, "Case title is required"),
  clientId: z.string().min(1, "Client is required"),
  caseType: z.enum([
    "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
    "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
  ]).default("CIVIL"),
  status: z.enum([
    "OPEN", "ACTIVE", "ON_HOLD", "PENDING", "CLOSED", "ARCHIVED",
  ]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  description: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
