import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isApiAuth = pathname.startsWith("/api/auth");
  const isApiRegister = pathname.startsWith("/api/v1/auth/register");

  if (isApiAuth || isApiRegister) {
    return NextResponse.next();
  }

  if (!req.auth && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && isPublicRoute) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
