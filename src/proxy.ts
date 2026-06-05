import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSessionToken, SESSION_COOKIE_NAME } from "./lib/auth/crypto";

const publicRoutes = ["/login"];

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(pathname);
  const session = parseSessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};