import type { NextRequest } from "next/server";

/**
 * Public base URL for building shareable links (client portal, public intake,
 * e-signature, calendar feed).
 *
 * In production the app runs behind DigitalOcean's proxy, so
 * `request.nextUrl.origin` resolves to the internal bind address
 * (e.g. http://0.0.0.0:8080) — never share that. Prefer the configured public
 * URL and only fall back to the request origin for local dev.
 */
export function publicBaseUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    req.nextUrl.origin
  );
}
