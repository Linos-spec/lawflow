import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { PRACTICE_AREAS, PRACTICE_AREA_KEYS } from "@/lib/practice-areas/catalog";

export const runtime = "nodejs";

const MAX_ROWS = 2000;

const CASE_STATUSES = ["OPEN", "ACTIVE", "ON_HOLD", "PENDING", "CLOSED", "ARCHIVED"] as const;
type CaseStatus = (typeof CASE_STATUSES)[number];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// matterType label/key → catalog key
const TYPE_LOOKUP: Record<string, string> = {};
for (const a of PRACTICE_AREAS) {
  TYPE_LOOKUP[norm(a.key)] = a.key;
  TYPE_LOOKUP[norm(a.label)] = a.key;
}
function mapType(raw?: string): { value: string; warning?: string } {
  if (!raw || !raw.trim()) return { value: "CIVIL" };
  const hit = TYPE_LOOKUP[norm(raw)];
  if (hit) return { value: hit };
  return { value: "CIVIL", warning: `Unrecognized matter type “${raw}” — set to Civil` };
}

const STATUS_SYNONYMS: Record<string, CaseStatus> = {
  open: "OPEN", intake: "OPEN", new: "OPEN",
  active: "ACTIVE", inprogress: "ACTIVE",
  onhold: "ON_HOLD", hold: "ON_HOLD", paused: "ON_HOLD",
  pending: "PENDING", waiting: "PENDING",
  closed: "CLOSED", done: "CLOSED", complete: "CLOSED", completed: "CLOSED",
  archived: "ARCHIVED",
};
function mapStatus(raw?: string): { value: CaseStatus; warning?: string } {
  if (!raw || !raw.trim()) return { value: "OPEN" };
  const hit = STATUS_SYNONYMS[norm(raw)];
  if (hit) return { value: hit };
  return { value: "OPEN", warning: `Unrecognized status “${raw}” — set to Open` };
}
function parseDate(raw?: string): { value?: Date; warning?: string } {
  if (!raw || !raw.trim()) return {};
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) return { warning: `Unrecognized open date “${raw}” — left blank` };
  return { value: d };
}

interface MappedRow {
  matterName?: string;
  clientName?: string;
  matterType?: string;
  status?: string;
  openDate?: string;
  description?: string;
  referenceNumber?: string;
}

/**
 * Bulk-create matters from mapped CSV rows. Records are only created here — the
 * client validates a preview first and the user confirms before this runs.
 * Every row is classified: imported / skipped (missing required) / failed (error).
 */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  let body: { rows?: MappedRow[] };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) return errorResponse("No rows to import", 400);
  if (rows.length > MAX_ROWS) return errorResponse(`Too many rows (max ${MAX_ROWS})`, 400);

  const imported: { row: number; caseId: string; caseNumber: string; warnings: string[] }[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const failed: { row: number; error: string }[] = [];
  let clientsCreated = 0;

  const year = new Date().getFullYear();
  let seq = await prisma.case.count({ where: { firmId: ctx.firmId } });
  // Case-insensitive client cache for this batch (name → id).
  const clientCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    const r = rows[i];
    const matterName = (r.matterName || "").trim();
    const clientName = (r.clientName || "").trim();

    if (!matterName || !clientName) {
      const missing = [!matterName && "Matter name", !clientName && "Client name"].filter(Boolean).join(" and ");
      skipped.push({ row: rowNum, reason: `${missing} is required` });
      continue;
    }

    try {
      // Resolve or create the client (by name, within the firm).
      const cacheKey = clientName.toLowerCase();
      let clientId = clientCache.get(cacheKey);
      if (!clientId) {
        const existing = await prisma.client.findFirst({
          where: { firmId: ctx.firmId, name: { equals: clientName, mode: "insensitive" } },
          select: { id: true },
        });
        if (existing) {
          clientId = existing.id;
        } else {
          const created = await prisma.client.create({
            data: { firmId: ctx.firmId, name: clientName, clientType: "INDIVIDUAL" },
            select: { id: true },
          });
          clientId = created.id;
          clientsCreated++;
        }
        clientCache.set(cacheKey, clientId);
      }

      const warnings: string[] = [];
      const t = mapType(r.matterType); if (t.warning) warnings.push(t.warning);
      const s = mapStatus(r.status); if (s.warning) warnings.push(s.warning);
      const d = parseDate(r.openDate); if (d.warning) warnings.push(d.warning);

      const ref = (r.referenceNumber || "").trim();
      const caseNumber = ref || `LF-${year}-${String(++seq).padStart(3, "0")}`;

      const created = await prisma.case.create({
        data: {
          firmId: ctx.firmId,
          clientId,
          title: matterName,
          caseType: (PRACTICE_AREA_KEYS as readonly string[]).includes(t.value) ? (t.value as (typeof PRACTICE_AREA_KEYS)[number]) : "CIVIL",
          status: s.value,
          description: (r.description || "").trim() || null,
          caseNumber,
          ...(d.value ? { openedDate: d.value } : {}),
        },
        select: { id: true, caseNumber: true },
      });
      imported.push({ row: rowNum, caseId: created.id, caseNumber: created.caseNumber, warnings });
    } catch (e) {
      const msg = e instanceof Error && /Unique constraint/i.test(e.message)
        ? "Duplicate reference number"
        : "Could not create matter";
      failed.push({ row: rowNum, error: msg });
    }
  }

  if (imported.length > 0) {
    await logAudit({
      firmId: ctx.firmId, userId: ctx.userId, action: "case.import", entity: "Case",
      entityId: imported[0].caseId,
      entityLabel: `${imported.length} matter(s) imported`,
      details: `Imported ${imported.length}, skipped ${skipped.length}, failed ${failed.length}, ${clientsCreated} new client(s)`,
    });
  }

  return successResponse({
    imported, skipped, failed,
    counts: { imported: imported.length, skipped: skipped.length, failed: failed.length, clientsCreated, total: rows.length },
  });
}
