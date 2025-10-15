// src/middleware.ts (NOT src/app/middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  
  // Redirect www to apex domain
  if (host.startsWith("www.")) {
    const newUrl = req.nextUrl.clone();
    newUrl.host = host.replace(/^www\./, "");
    
    return NextResponse.redirect(newUrl, 301); // Permanent redirect
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};