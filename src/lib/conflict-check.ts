import { prisma } from "@/lib/prisma";
import type { ConflictStatus } from "@prisma/client";

/**
 * Deterministic conflict-of-interest checker.
 *
 * Conflicts are an ethics matter, so this is intentionally rule-based and
 * explainable — never an AI guess. It surfaces every potential match with the
 * reason it matched so an attorney can make the final call. AI is used only to
 * *summarize* these results elsewhere, never to decide them.
 */

export type ConflictMatch = {
  type: "CLIENT" | "CASE" | "LEAD";
  id: string;
  name: string;
  /** Which searched name triggered this match */
  matchedOn: string;
  /** Whether the searched name was the prospect or an adverse party */
  role: "prospect" | "adverse";
  /** 0-1 similarity */
  score: number;
  /** Human-readable explanation for the attorney */
  reason: string;
};

export type ConflictResult = {
  status: ConflictStatus;
  searchedNames: string[];
  matches: ConflictMatch[];
  matchCount: number;
};

const ENTITY_SUFFIXES = [
  "llc", "l.l.c", "inc", "incorporated", "corp", "corporation", "co",
  "company", "ltd", "limited", "llp", "lp", "pllc", "pc", "plc", "group",
];

/** Lowercase, strip punctuation, drop common entity suffixes, collapse space. */
function normalize(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(" ").filter((t) => t && !ENTITY_SUFFIXES.includes(t));
  return tokens.join(" ");
}

function tokenSet(name: string): Set<string> {
  return new Set(normalize(name).split(" ").filter(Boolean));
}

/** Jaccard similarity over name tokens, with an exact-match short-circuit. */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  const jaccard = inter / union;
  // Boost when one name fully contains the other's tokens (e.g. "Acme" ⊂ "Acme Corp")
  const containment = inter / Math.min(sa.size, sb.size);
  return Math.max(jaccard, containment >= 1 ? 0.85 : jaccard);
}

const STRONG = 0.85; // treat as a firm match
const WEAK = 0.6; // worth surfacing for review

/**
 * Run a conflict check for a prospective matter.
 * `name` is the prospect; `adverseParties` are the opposing parties.
 */
export async function runConflictCheck(params: {
  firmId: string;
  name: string;
  adverseParties?: string[];
  /** Exclude this lead from the search (when re-checking an existing lead) */
  excludeLeadId?: string;
}): Promise<ConflictResult> {
  const { firmId, name, adverseParties = [], excludeLeadId } = params;
  const searchedNames = [name, ...adverseParties].map((n) => n.trim()).filter(Boolean);

  const [clients, cases, leads] = await Promise.all([
    prisma.client.findMany({
      where: { firmId },
      select: { id: true, name: true, company: true },
    }),
    prisma.case.findMany({
      where: { firmId },
      select: { id: true, title: true, client: { select: { name: true } } },
    }),
    prisma.lead.findMany({
      where: { firmId, ...(excludeLeadId ? { id: { not: excludeLeadId } } : {}) },
      select: { id: true, name: true, adverseParties: true },
    }),
  ]);

  const matches: ConflictMatch[] = [];
  const isAdverse = (searched: string) =>
    adverseParties.some((p) => p.trim() && p.trim() === searched);

  for (const searched of searchedNames) {
    const role: "prospect" | "adverse" = isAdverse(searched) ? "adverse" : "prospect";

    // Against existing clients — the highest-stakes comparison.
    for (const c of clients) {
      const candidates = [c.name, c.company].filter(Boolean) as string[];
      const score = Math.max(...candidates.map((cand) => similarity(searched, cand)), 0);
      if (score >= WEAK) {
        matches.push({
          type: "CLIENT",
          id: c.id,
          name: c.name,
          matchedOn: searched,
          role,
          score,
          reason:
            role === "adverse"
              ? `Adverse party "${searched}" resembles existing client "${c.name}" — representing against a current client is a direct conflict.`
              : `Prospect "${searched}" resembles existing client "${c.name}" — possible prior/existing relationship.`,
        });
      }
    }

    // Against parties named in existing cases (via case title + client name).
    for (const cs of cases) {
      const candidates = [cs.title, cs.client?.name].filter(Boolean) as string[];
      const score = Math.max(...candidates.map((cand) => similarity(searched, cand)), 0);
      if (score >= WEAK) {
        matches.push({
          type: "CASE",
          id: cs.id,
          name: cs.title,
          matchedOn: searched,
          role,
          score,
          reason: `"${searched}" appears related to existing case "${cs.title}".`,
        });
      }
    }

    // Against other leads and their adverse parties.
    for (const l of leads) {
      const candidates = [l.name, ...(l.adverseParties || [])];
      const score = Math.max(...candidates.map((cand) => similarity(searched, cand)), 0);
      if (score >= WEAK) {
        matches.push({
          type: "LEAD",
          id: l.id,
          name: l.name,
          matchedOn: searched,
          role,
          score,
          reason: `"${searched}" resembles another lead "${l.name}" or its adverse parties.`,
        });
      }
    }
  }

  // Keep the strongest match per (type,id) pair.
  const dedup = new Map<string, ConflictMatch>();
  for (const m of matches) {
    const key = `${m.type}:${m.id}`;
    const existing = dedup.get(key);
    if (!existing || m.score > existing.score) dedup.set(key, m);
  }
  const finalMatches = [...dedup.values()].sort((a, b) => b.score - a.score);

  const status = classify(finalMatches);

  return {
    status,
    searchedNames,
    matches: finalMatches,
    matchCount: finalMatches.length,
  };
}

function classify(matches: ConflictMatch[]): ConflictStatus {
  if (matches.length === 0) return "CLEAR";
  // A strong adverse-vs-client match is a direct conflict.
  const directConflict = matches.some(
    (m) => m.role === "adverse" && m.type === "CLIENT" && m.score >= STRONG
  );
  if (directConflict) return "CONFLICT";
  // Anything else that matched is worth attorney review.
  return "POTENTIAL";
}
