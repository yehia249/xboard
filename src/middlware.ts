// src/middleware.ts (NOT src/app/middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  
  // Add noindex to www subdomain
  if (host.startsWith("www.")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, follow");
    return res;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};