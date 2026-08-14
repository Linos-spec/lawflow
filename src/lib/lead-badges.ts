import {
  ShieldAlert, ShieldCheck, ShieldQuestion, Shield,
} from "lucide-react";

export const SOURCE_LABELS: Record<string, string> = {
  PHONE: "Phone", WEBSITE: "Website", REFERRAL: "Referral", GOOGLE: "Google", WALK_IN: "Walk-in", EMAIL: "Email", OTHER: "Other",
};

export const STAGE_LABELS: Record<string, string> = {
  NEW: "New", QUALIFYING: "Qualifying", QUALIFIED: "Qualified", CONSULT_SCHEDULED: "Consult scheduled",
  ENGAGED: "Engaged", CONVERTED: "Converted", DISQUALIFIED: "Disqualified", LOST: "Lost",
};

export const STAGES = ["NEW", "QUALIFYING", "QUALIFIED", "CONSULT_SCHEDULED", "ENGAGED", "CONVERTED", "DISQUALIFIED", "LOST"];

export function conflictBadge(status: string): {
  bg: string; text: string; label: string; Icon: React.ElementType;
} {
  const map: Record<string, { bg: string; text: string; label: string; Icon: React.ElementType }> = {
    CLEAR: { bg: "var(--success-bg, #e6f4ec)", text: "var(--success, #2e7d5b)", label: "Clear", Icon: ShieldCheck },
    POTENTIAL: { bg: "var(--warning-bg, #fbf1e0)", text: "var(--warning, #b7791f)", label: "Potential", Icon: ShieldQuestion },
    CONFLICT: { bg: "var(--danger-bg, #fbe9e9)", text: "var(--danger, #c0392b)", label: "Conflict", Icon: ShieldAlert },
    WAIVED: { bg: "var(--info-bg, #e7f0fb)", text: "var(--info, #2b6cb0)", label: "Waived", Icon: Shield },
    PENDING: { bg: "rgba(15,27,51,0.06)", text: "var(--text-secondary)", label: "Pending", Icon: Shield },
  };
  return map[status] || map.PENDING;
}
