// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const accept = req.headers.get("accept") || "";

  // Keep www working, but tell bots not to index HTML pages on www
  if (host.startsWith("www.") && accept.includes("text/html")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, follow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"], // apply to all paths
};
