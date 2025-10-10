// app/api/paynow/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/paynow/subscriptions?userUid=...
 * Looks up the user's paynow_customer_id in Supabase, and if present,
 * fetches subscriptions from PayNow Management API, filtered by that customer_id.
 */
export async function GET(req: NextRequest) {
  try {
    const PAYNOW_API_KEY = process.env.PAYNOW_API_KEY;   // EXACT header for Management API
    const PAYNOW_STORE_ID = process.env.PAYNOW_STORE_ID; // e.g., "411486491630370816"
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!PAYNOW_API_KEY) return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    if (!PAYNOW_STORE_ID) return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const userUid = searchParams.get("userUid") || "";
    if (!userUid) return NextResponse.json({ error: "Missing userUid" }, { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Find mapping
    const { data: mapping, error: mapErr } = await supabase
      .from("paynow_customers")
      .select("paynow_customer_id")
      .eq("firebase_uid", userUid)
      .maybeSingle();

    if (mapErr) {
      return NextResponse.json({ error: "Lookup error", detail: mapErr.message }, { status: 500 });
    }
    if (!mapping?.paynow_customer_id) {
      return NextResponse.json({ hasAccount: false, subscriptions: [] }, { status: 200 });
    }

    const base = `https://api.paynow.gg/v1/stores/${PAYNOW_STORE_ID}`;
    const headers = {
      Authorization: PAYNOW_API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const url = `${base}/subscriptions?customer_id=${encodeURIComponent(mapping.paynow_customer_id)}&limit=100`;
    const resp = await fetch(url, { headers });
    const text = await resp.text();

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", detail: text, status: resp.status },
        { status: 502 }
      );
    }

    const subs = JSON.parse(text);
    return NextResponse.json({
      hasAccount: true,
      customerId: mapping.paynow_customer_id,
      subscriptions: Array.isArray(subs) ? subs : [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "subs fetch error" }, { status: 500 });
  }
}
