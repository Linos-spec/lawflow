import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Login helper: verify email+password WITHOUT creating a session, and report
 * whether a second factor is required. The login page uses this to decide
 * whether to prompt for a 2FA code before calling signIn. (MVP: add per-IP rate
 * limiting before heavy production use — this is a password oracle like any login.)
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return json({ valid: false }); }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) return json({ valid: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { hashedPassword: true, mfaEnabled: true },
  });
  if (!user) return json({ valid: false });

  const ok = await compare(password, user.hashedPassword);
  if (!ok) return json({ valid: false });

  return json({ valid: true, mfaRequired: user.mfaEnabled });
}

function json(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}
