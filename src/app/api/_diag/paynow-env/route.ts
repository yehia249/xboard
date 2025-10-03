// src/app/api/_diag/paynow-env/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.PAYNOW_API_KEY || "";
  return NextResponse.json({
    present: Boolean(raw),
    prefix: raw ? raw.slice(0, 6) : null, // e.g., "pnapi_"
  });
}