import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATH_PREFIXES = ["/login", "/feedback", "/join", "/api/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    if (req.auth && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
