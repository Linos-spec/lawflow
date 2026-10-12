import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { sendEmail } from "@/lib/mailer";
import { platformAdminEmails } from "@/lib/platform-admin";

export const runtime = "nodejs";

/**
 * Public: a prospect requests access (gated signup). Creates a PENDING
 * AccessRequest and notifies the platform operator by email. Always confirms
 * receipt (no enumeration of existing customers).
 */
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; firmName?: string; phone?: string; message?: string; acceptedTerms?: boolean };
  try { body = await req.json(); } catch { return errorResponse("Invalid request", 400); }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const firmName = (body.firmName || "").trim();
  const phone = (body.phone || "").trim() || null;
  const message = (body.message || "").trim().slice(0, 2000) || null;

  if (!name || !email || !firmName) return errorResponse("Name, email, and firm name are required.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("Enter a valid email.", 400);
  if (body.acceptedTerms !== true) return errorResponse("Please accept the Terms of Service and DPA to continue.", 400);

  // De-dupe: if there's already a pending request for this email, don't stack.
  const existing = await prisma.accessRequest.findFirst({ where: { email, status: "PENDING" }, select: { id: true } });
  if (!existing) {
    await prisma.accessRequest.create({ data: { name, email, firmName, phone, message } });

    // Notify the operator(s) — the "inbox monitoring" for new sign-ups.
    const admins = platformAdminEmails();
    if (admins.length) {
      await sendEmail({
        to: admins.join(","),
        subject: `New access request — ${firmName}`,
        text: `New access request on Linoscore Legal:\n\nFirm: ${firmName}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nMessage: ${message || "—"}\n\nReview and approve at ${"https://legal.linoscore.com"}/admin`,
        html: `<p><b>New access request</b> on Linoscore Legal:</p>
<ul>
<li><b>Firm:</b> ${escapeHtml(firmName)}</li>
<li><b>Name:</b> ${escapeHtml(name)}</li>
<li><b>Email:</b> ${escapeHtml(email)}</li>
<li><b>Phone:</b> ${escapeHtml(phone || "—")}</li>
<li><b>Message:</b> ${escapeHtml(message || "—")}</li>
</ul>
<p><a href="https://legal.linoscore.com/admin">Review &amp; approve in the Platform Console →</a></p>`,
      }).catch(() => {});
    }
  }

  return successResponse({ received: true });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
