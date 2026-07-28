import { z } from "zod";

export const publicLeadSchema = z.object({
  publicId: z.string().min(1, "Missing intake link id"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  caseType: z
    .enum([
      "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
      "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
    ])
    .default("OTHER"),
  description: z.string().optional().or(z.literal("")),
  // Opposing / adverse parties for the conflict check.
  adverseParties: z.array(z.string()).default([]),

  // ── Recommended minimum intake ──
  clientType: z.enum(["INDIVIDUAL", "BUSINESS_ENTITY", "GOVERNMENT", "NONPROFIT", "TRUST", "ESTATE"]).optional(),
  preferredName: z.string().optional().or(z.literal("")),
  preferredContactMethod: z.enum(["EMAIL", "MOBILE_PHONE", "WORK_PHONE", "HOME_PHONE", "MAIL", "PORTAL"]).optional(),
  addressOrJurisdiction: z.string().optional().or(z.literal("")),
  referralSource: z.string().optional().or(z.literal("")),
  consultationPreference: z.string().optional().or(z.literal("")),
  importantDates: z.string().optional().or(z.literal("")),
  consentToContact: z.boolean().optional(),
  // Language the prospect filled the form in (for multilingual intake).
  intakeLanguage: z.string().optional(),

  // Free-form questionnaire answers (branching by matter type).
  answers: z.record(z.string(), z.unknown()).optional(),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
