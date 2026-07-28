import { z } from "zod";

const optStr = z.string().optional();
const optEmail = z.string().email("Invalid email").optional().or(z.literal(""));
// Accept "" / null / ISO string → Date | undefined
const optDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional()
);
const optBool = z.boolean().optional();
const optNum = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().optional()
);

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  clientType: z.enum(["INDIVIDUAL", "BUSINESS_ENTITY", "GOVERNMENT", "NONPROFIT", "TRUST", "ESTATE"]).default("INDIVIDUAL"),
  status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE", "FORMER", "DECLINED"]).optional(),

  // Identity (individual)
  legalName: optStr,
  preferredName: optStr,
  aliases: z.array(z.string()).optional(),
  pronouns: optStr,
  dateOfBirth: optDate,
  placeOfBirth: optStr,
  nationality: optStr,
  preferredLanguage: optStr,
  interpreterRequired: optBool,
  photoUrl: optStr,

  // Identity (organization)
  company: optStr,
  legalBusinessName: optStr,
  dbaNames: z.array(z.string()).optional(),
  entityType: optStr,
  formationState: optStr,
  formationCountry: optStr,
  formationDate: optDate,
  registrationNumber: optStr,
  taxId: optStr,
  registeredAgent: optStr,
  industry: optStr,
  website: optStr,
  parentCompany: optStr,

  // Contact information
  email: optEmail,
  secondaryEmail: optEmail,
  phone: optStr,
  mobilePhone: optStr,
  workPhone: optStr,
  homePhone: optStr,
  preferredContactMethod: z.enum(["EMAIL", "MOBILE_PHONE", "WORK_PHONE", "HOME_PHONE", "MAIL", "PORTAL"]).optional(),
  bestTimeToContact: optStr,
  address: optStr,
  mailingAddress: optStr,
  previousAddress: optStr,
  emergencyContactName: optStr,
  emergencyContactPhone: optStr,
  emergencyContactRelation: optStr,
  communicationRestrictions: optStr,
  permitVoicemail: optBool,
  permitText: optBool,
  permitEmail: optBool,
  portalEnabled: optBool,

  // Billing & payment (tokenized refs only — never raw card/bank data)
  billingContact: optStr,
  billingAddress: optStr,
  billingEmail: optEmail,
  billingArrangement: z.enum(["HOURLY", "FLAT_FEE", "CONTINGENCY", "RETAINER", "EVERGREEN_RETAINER", "PRO_BONO", "MIXED"]).optional(),
  hourlyRate: optNum,
  flatFee: optNum,
  contingencyPercent: optNum,
  retainerAmount: optNum,
  evergreenThreshold: optNum,
  trustBalance: optNum,
  billingFrequency: z.enum(["MONTHLY", "QUARTERLY", "MILESTONE", "ON_COMPLETION", "ANNUAL"]).optional(),
  invoiceDeliveryMethod: optStr,
  paymentTerms: optStr,
  taxStatus: optStr,
  taxVatNumber: optStr,
  purchaseOrderNumber: optStr,
  ebillingSystem: optStr,
  billingGuidelines: optStr,
  discountPercent: optNum,
  feeCap: optNum,
  acceptedPaymentMethods: z.array(z.string()).optional(),
  paymentPlanDetails: optStr,
  outstandingBalance: optNum,
  creditBalance: optNum,
  collectionsStatus: z.enum(["CURRENT", "PAST_DUE", "IN_COLLECTIONS", "WRITTEN_OFF"]).optional(),
  paymentProviderCustomerId: optStr,
  paymentMethodRef: optStr,

  notes: optStr,
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/** Convert "" → null so optional text columns store NULL, not empty strings. */
export function normalizeClientInput<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) out[k] = v === "" ? null : v;
  return out as T;
}
