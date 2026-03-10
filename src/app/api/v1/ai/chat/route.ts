import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const firmId = ctx.firmId;
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are an AI legal practice assistant for LawFlow, a law practice management system. You help lawyers and legal staff with questions about their cases, deadlines, billing, and clients.

You have access to tools that can query the firm's database. Use these tools proactively when the user asks about their data. Always be professional, concise, and helpful.

Key behaviors:
- When asked about cases, deadlines, or billing, use the appropriate tool to look up real data
- Present data in a clear, organized format
- Highlight urgent items (overdue deadlines, unpaid invoices)
- Provide actionable recommendations when appropriate
- If you don't have enough information, ask clarifying questions
- Never make up case numbers, dates, or financial figures — always use the tools to get real data
- Format currency amounts properly (e.g., $1,234.56)
- Format dates in a human-readable way (e.g., March 15, 2026)`,
    messages,
    tools: {
      searchCases: tool({
        description:
          "Search cases by keyword, status, or type. Use this when the user asks about cases.",
        inputSchema: z.object({
          search: z.string().optional().describe("Search keyword for case title"),
          status: z
            .enum(["OPEN", "ACTIVE", "ON_HOLD", "PENDING", "CLOSED", "ARCHIVED"])
            .optional()
            .describe("Filter by case status"),
          limit: z.number().optional().default(10).describe("Max results to return"),
        }),
        execute: async ({ search, status, limit }) => {
          const where: Record<string, unknown> = { firmId };
          if (search) {
            where.title = { contains: search, mode: "insensitive" };
          }
          if (status) where.status = status;

          const cases = await prisma.case.findMany({
            where,
            include: { client: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: limit || 10,
          });

          return cases.map((c) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            title: c.title,
            status: c.status,
            caseType: c.caseType,
            priority: c.priority,
            clientName: c.client.name,
            createdAt: c.createdAt.toISOString().split("T")[0],
          }));
        },
      }),

      getDeadlines: tool({
        description:
          "Get upcoming or overdue deadlines. Use when the user asks about deadlines or upcoming dates.",
        inputSchema: z.object({
          status: z
            .enum(["PENDING", "COMPLETED", "OVERDUE", "CANCELLED"])
            .optional()
            .describe("Filter by deadline status"),
          daysAhead: z
            .number()
            .optional()
            .default(30)
            .describe("Number of days ahead to look for pending deadlines"),
        }),
        execute: async ({ status, daysAhead }) => {
          const where: Record<string, unknown> = {};
          where.case = { firmId };
          if (status) {
            where.status = status;
          }
          if (!status || status === "PENDING") {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (daysAhead || 30));
            where.dueDate = { lte: futureDate };
          }

          const deadlines = await prisma.deadline.findMany({
            where,
            include: { case: { select: { caseNumber: true, title: true } } },
            orderBy: { dueDate: "asc" },
            take: 20,
          });

          return deadlines.map((d) => ({
            id: d.id,
            title: d.title,
            dueDate: d.dueDate.toISOString().split("T")[0],
            status: d.status,
            priority: d.priority,
            caseNumber: d.case.caseNumber,
            caseTitle: d.case.title,
          }));
        },
      }),

      getBillingSummary: tool({
        description:
          "Get billing/invoice information. Use when the user asks about billing, invoices, revenue, or payments.",
        inputSchema: z.object({
          paymentStatus: z
            .enum(["UNPAID", "PARTIAL", "PAID", "OUTSTANDING", "OVERDUE", "VOID"])
            .optional()
            .describe("Filter by payment status"),
        }),
        execute: async ({ paymentStatus }) => {
          const where: Record<string, unknown> = { firmId };
          if (paymentStatus) where.paymentStatus = paymentStatus;

          const records = await prisma.billingRecord.findMany({
            where,
            include: {
              client: { select: { name: true } },
              case: { select: { caseNumber: true, title: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          });

          const totalBilled = records.reduce(
            (sum, r) => sum + Number(r.totalAmount),
            0
          );
          const totalPaid = records.reduce(
            (sum, r) => sum + Number(r.paidAmount),
            0
          );

          return {
            summary: {
              totalRecords: records.length,
              totalBilled: totalBilled.toFixed(2),
              totalPaid: totalPaid.toFixed(2),
              totalOutstanding: (totalBilled - totalPaid).toFixed(2),
            },
            records: records.map((r) => ({
              invoiceNumber: r.invoiceNumber,
              clientName: r.client.name,
              caseNumber: r.case?.caseNumber || "N/A",
              totalAmount: Number(r.totalAmount).toFixed(2),
              paidAmount: Number(r.paidAmount).toFixed(2),
              paymentStatus: r.paymentStatus,
              dueDate: r.dueDate?.toISOString().split("T")[0] || "N/A",
            })),
          };
        },
      }),

      getClientInfo: tool({
        description:
          "Look up client information. Use when the user asks about a specific client.",
        inputSchema: z.object({
          search: z.string().describe("Client name to search for"),
        }),
        execute: async ({ search }) => {
          const clients = await prisma.client.findMany({
            where: {
              firmId,
              name: { contains: search, mode: "insensitive" },
            },
            include: {
              cases: {
                select: { caseNumber: true, title: true, status: true },
              },
            },
            take: 5,
          });

          return clients.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            company: c.company,
            clientType: c.clientType,
            cases: c.cases.map((cs) => ({
              caseNumber: cs.caseNumber,
              title: cs.title,
              status: cs.status,
            })),
          }));
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}
