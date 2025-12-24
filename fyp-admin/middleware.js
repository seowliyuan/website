import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("admin_token")?.value;

  // If user not logged in as admin, block access to /admin/*
  if (!token && req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
