import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function getOrgFirmIds() {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }
  return {
    organizationId: session.user.organizationId,
    firmId: session.user.firmId,
    userId: session.user.id,
    role: session.user.role,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
