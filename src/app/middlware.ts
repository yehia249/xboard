// src/middleware.ts  (or middleware.ts at project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STATIC_EXT = /\.(css|js|mjs|png|jpe?g|webp|gif|svg|ico|json|xml|txt|map|woff2?|ttf|otf)$/i;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";

  // Only touch the www host; leave apex alone
  if (host.startsWith("www.")) {
    // Skip obvious static assets to avoid unnecessary headers
    if (!STATIC_EXT.test(url.pathname)) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }
  }

  return NextResponse.next();
}

// Apply to all paths
export const config = {
  matcher: ["/:path*"],
};
