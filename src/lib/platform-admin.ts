import { auth } from "@/lib/auth";

/**
 * Platform-owner (super-admin) access — the operator of Linoscore Legal, NOT a
 * firm admin. Cross-tenant by design, so it is gated on an env allowlist that
 * only the operator controls (never a DB flag a tenant could reach):
 *   PLATFORM_ADMIN_EMAILS="you@linosconsulting.com,ops@…"  (comma-separated)
 */
export function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return platformAdminEmails().includes(email.toLowerCase());
}

/** Returns the signed-in platform-admin's email, or null if not authorized. */
export async function requirePlatformAdmin(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return isPlatformAdminEmail(email) ? email : null;
}
