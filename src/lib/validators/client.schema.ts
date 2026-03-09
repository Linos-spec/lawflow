import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  clientType: z.enum(["INDIVIDUAL", "BUSINESS_ENTITY", "GOVERNMENT"]).default("INDIVIDUAL"),
  company: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
