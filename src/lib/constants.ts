// Label maps for all enums

import { PRACTICE_AREA_LABELS } from "./practice-areas/catalog";

// Lifecycle: Intake → Active → On hold → Closed. "Open" was ambiguous next to
// "Active", so the initial state now reads "Intake" (enum key stays OPEN).
export const CASE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Intake",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  PENDING: "Pending",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

// Practice-area (matter type) labels come from the canonical catalog so pickers,
// badges, filters, and AI classification never drift out of sync.
export const CASE_TYPE_LABELS: Record<string, string> = PRACTICE_AREA_LABELS;

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individual",
  BUSINESS_ENTITY: "Business Entity",
  GOVERNMENT: "Government",
};

export const DEADLINE_TYPE_LABELS: Record<string, string> = {
  FILING: "Filing",
  COURT_APPEARANCE: "Court Appearance",
  DISCOVERY: "Discovery",
  STATUTE_OF_LIMITATIONS: "Statute of Limitations",
  CLIENT_MEETING: "Client Meeting",
  INTERNAL: "Internal",
  OTHER: "Other",
};

export const DEADLINE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const BILLING_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Hourly",
  FLAT_FEE: "Flat Fee",
  CONTINGENCY: "Contingency",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  OUTSTANDING: "Outstanding",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const INTAKE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  CONVERTED: "Converted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PARTNER: "Partner",
  ASSOCIATE: "Associate",
  PARALEGAL: "Paralegal",
};

// Badge variant mappings
export const CASE_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-orange-100 text-orange-800",
  CLOSED: "bg-gray-100 text-gray-800",
  ARCHIVED: "bg-slate-100 text-slate-800",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OUTSTANDING: "bg-orange-100 text-orange-800",
  OVERDUE: "bg-red-200 text-red-900",
  VOID: "bg-gray-100 text-gray-800",
};

export const INTAKE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_REVIEW: "bg-blue-100 text-blue-800",
  CONVERTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export const DEADLINE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};
