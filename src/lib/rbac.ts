/**
 * Role-based access control. Roles are hierarchical
 * (ADMIN > PARTNER > ASSOCIATE > PARALEGAL) but permissions are declared
 * explicitly per action so intent is auditable rather than implied by rank.
 */

export type Role = "ADMIN" | "PARTNER" | "ASSOCIATE" | "PARALEGAL";

export type Permission =
  | "matter.delete"
  | "client.delete"
  | "client.export"
  | "audit.view"
  | "team.manage"
  | "billing.manage"
  | "firm.config";

const PERMISSIONS: Record<Permission, Role[]> = {
  "matter.delete": ["ADMIN", "PARTNER"],
  "client.delete": ["ADMIN"],
  "client.export": ["ADMIN", "PARTNER"],
  "audit.view": ["ADMIN"],
  "team.manage": ["ADMIN"],
  "billing.manage": ["ADMIN", "PARTNER"],
  "firm.config": ["ADMIN"],
};

export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission]?.includes(role as Role) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  PARTNER: "Partner",
  ASSOCIATE: "Associate",
  PARALEGAL: "Paralegal",
};
