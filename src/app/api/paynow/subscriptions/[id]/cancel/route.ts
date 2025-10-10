// app/api/paynow/subscriptions/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/paynow/subscriptions/:id/cancel
 * Body: { userUid: string }
 * Verifies subscription belongs to the user's paynow_customer_id, then cancels it.
 */
export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const PAYNOW_API_KEY = process.env.PAYNOW_API_KEY;
    const PAYNOW_STORE_ID = process.env.PAYNOW_STORE_ID;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!PAYNOW_API_KEY) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!PAYNOW_STORE_ID) {
      return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });
    }

    const { userUid } = await req.json();
    const subscriptionId = context.params.id;

    if (!userUid || !subscriptionId) {
      return NextResponse.json({ error: "Missing userUid/subscriptionId" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Map user → PayNow customer
    const { data: mapping, error: mapErr } = await supabase
      .from("paynow_customers")
      .select("paynow_customer_id")
      .eq("firebase_uid", userUid)
      .maybeSingle();

    if (mapErr) {
      return NextResponse.json({ error: "Mapping lookup failed", detail: mapErr.message }, { status: 500 });
    }
    if (!mapping?.paynow_customer_id) {
      return NextResponse.json({ error: "No PayNow account for user" }, { status: 403 });
    }

    const base = `https://api.paynow.gg/v1/stores/${PAYNOW_STORE_ID}`;
    const headers: HeadersInit = {
      Authorization: PAYNOW_API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Verify the subscription belongs to this customer
    const getResp = await fetch(`${base}/subscriptions/${subscriptionId}`, { headers });
    const getText = await getResp.text();

    if (!getResp.ok) {
      return NextResponse.json(
        { error: "Failed to load subscription", detail: getText, status: getResp.status },
        { status: 502 }
      );
    }

    const sub = JSON.parse(getText);
    const subCustomerId = sub?.customer?.id || sub?.customer_id;

    if (String(subCustomerId) !== String(mapping.paynow_customer_id)) {
      return NextResponse.json({ error: "Subscription does not belong to this user" }, { status: 403 });
    }

    // Cancel the subscription
    const cancelResp = await fetch(`${base}/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers,
    });

    if (cancelResp.status === 204) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const detail = await cancelResp.text();
    return NextResponse.json(
      { error: "Cancel failed", detail, status: cancelResp.status },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "cancel error" }, { status: 500 });
  }
}
