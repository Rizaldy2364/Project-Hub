import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/tasks") ||
    req.nextUrl.pathname.startsWith("/projects") ||
    req.nextUrl.pathname.startsWith("/calendar") ||
    req.nextUrl.pathname.startsWith("/inbox") ||
    req.nextUrl.pathname.startsWith("/tim") ||
    req.nextUrl.pathname.startsWith("/profile");

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/projects/:path*",
    "/calendar/:path*",
    "/inbox/:path*",
    "/tim/:path*",
    "/profile/:path*",
  ],
};