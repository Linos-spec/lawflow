import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Public iCal feed — subscribe in Google/Outlook/Apple. Gated by an unguessable
// token. Read-only; exposes deadline titles + matter numbers, not case details.

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function pad(n: number) { return String(n).padStart(2, "0"); }
function dateOnly(d: Date) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }
function stamp(d: Date) { return `${dateOnly(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}Z`; }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cleanToken = token.replace(/\.ics$/i, "");

  const firm = await prisma.firm.findUnique({ where: { calendarToken: cleanToken }, select: { id: true, name: true } });
  if (!firm) return new Response("Calendar not found", { status: 404 });

  const deadlines = await prisma.deadline.findMany({
    where: { firmId: firm.id, status: { in: ["PENDING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    take: 1000,
    include: { case: { select: { caseNumber: true, title: true } } },
  });

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Linos Legal//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(firm.name)} — Deadlines`,
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const d of deadlines) {
    const due = new Date(d.dueDate);
    const matter = d.case ? ` [${d.case.caseNumber}]` : "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:deadline-${d.id}@linoscore`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${dateOnly(due)}`,
      `SUMMARY:${icsEscape(d.title + matter)}`,
      `DESCRIPTION:${icsEscape([d.description || "", d.case ? `Matter: ${d.case.title}` : ""].filter(Boolean).join("\n"))}`,
      // A day-before reminder in the subscriber's calendar app.
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-P1D",
      `DESCRIPTION:${icsEscape(d.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${cleanToken}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
