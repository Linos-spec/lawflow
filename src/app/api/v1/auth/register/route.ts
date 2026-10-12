import { errorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/**
 * Open self-signup is disabled — access is gated behind operator approval.
 * Prospects request access at /register (POST /api/public/access-request);
 * the operator approves in /admin, which provisions the firm and emails an invite.
 */
export async function POST() {
  return errorResponse("Sign-ups are by approval. Please request access at /register.", 403);
}
