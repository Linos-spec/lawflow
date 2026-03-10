import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/signup", "/pricing", "/features"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Redirect /signup → /register (common alias)
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Root "/" is the landing page for unauthenticated, dashboard for authenticated
  if (pathname === "/") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - /api (API routes handle their own auth with JSON 401 responses)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /sitemap.xml, /robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
