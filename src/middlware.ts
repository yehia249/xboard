// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";

  // 301 redirect www → non-www (canonical host)
  if (host.startsWith("www.")) {
    url.host = host.replace(/^www\./, "");
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

// run on all paths
export const config = {
  matcher: ["/:path*"],
};
