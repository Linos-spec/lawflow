import { z } from "zod";

export const createBillingSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  caseId: z.string().min(1, "Related case is required"),
  billingType: z.enum(["HOURLY", "FLAT_FEE", "CONTINGENCY"]).default("HOURLY"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional().or(z.literal("")),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(0),
      rate: z.number().min(0),
      amount: z.number().min(0),
    })
  ).min(1, "At least one line item is required"),
});

export type CreateBillingInput = z.infer<typeof createBillingSchema>;
