import { z } from "zod";

export const createIntakeSchema = z.object({
  prospectName: z.string().min(1, "Client name is required"),
  prospectEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  prospectPhone: z.string().optional().or(z.literal("")),
  caseType: z.enum([
    "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
    "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
  ]).default("OTHER"),
  description: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateIntakeInput = z.infer<typeof createIntakeSchema>;
