import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { computeEntitlement } from "@/lib/entitlement";
import { SEAT_PRICE_USD } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Platform-owner view of every customer firm: one call returns portfolio summary
 * metrics + the full firm list. Cross-tenant — gated to platform admins only.
 */
export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return errorResponse("Not authorized", 403);

  const firms = await prisma.firm.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, createdAt: true,
      trialEndsAt: true, subscriptionStatus: true, subscribedSeats: true,
      calendlyUrl: true,
      _count: { select: { users: true, cases: true, clients: true, leads: true } },
    },
  });

  // Last activity per firm (one grouped query, not N+1).
  const activity = await prisma.auditLog.groupBy({ by: ["firmId"], _max: { createdAt: true } });
  const lastByFirm = new Map(activity.map((a) => [a.firmId, a._max.createdAt]));

  const now = Date.now();
  const rows = firms.map((f) => {
    const ent = computeEntitlement({ trialEndsAt: f.trialEndsAt, subscriptionStatus: f.subscriptionStatus });
    const trialDaysLeft = f.trialEndsAt ? Math.ceil((f.trialEndsAt.getTime() - now) / 86_400_000) : null;
    const seats = f.subscribedSeats ?? f._count.users;
    const mrr = ent.status === "active" ? seats * SEAT_PRICE_USD : 0;
    return {
      id: f.id,
      name: f.name,
      email: f.email,
      createdAt: f.createdAt.toISOString(),
      status: ent.status,                 // trialing | active | past_due | trial_expired | canceled | none
      locked: ent.locked,
      trialEndsAt: f.trialEndsAt ? f.trialEndsAt.toISOString() : null,
      trialDaysLeft,
      users: f._count.users,
      matters: f._count.cases,
      clients: f._count.clients,
      leads: f._count.leads,
      seats,
      mrr,
      calendlyConnected: !!f.calendlyUrl,
      lastActivity: lastByFirm.get(f.id)?.toISOString() ?? null,
    };
  });

  const byStatus: Record<string, number> = {};
  let mrr = 0, totalUsers = 0, totalMatters = 0, newLast30d = 0, trialsEndingSoon = 0;
  const thirtyAgo = now - 30 * 86_400_000;
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    mrr += r.mrr;
    totalUsers += r.users;
    totalMatters += r.matters;
    if (new Date(r.createdAt).getTime() >= thirtyAgo) newLast30d++;
    if (r.status === "trialing" && r.trialDaysLeft != null && r.trialDaysLeft <= 7) trialsEndingSoon++;
  }

  return successResponse({
    summary: {
      totalFirms: rows.length,
      byStatus,
      activePaying: byStatus["active"] || 0,
      trialing: byStatus["trialing"] || 0,
      pastDue: byStatus["past_due"] || 0,
      mrr,
      totalUsers,
      totalMatters,
      newLast30d,
      trialsEndingSoon,
      seatPrice: SEAT_PRICE_USD,
    },
    firms: rows,
  });
}
