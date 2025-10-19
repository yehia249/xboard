// app/api/paynow/customer-upsert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/paynow/customer-upsert
 * Body: { userUid: string, email: string }
 * Returns: { customerId: string, created: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { userUid, email } = await req.json();

    // --- envs
    const PAYNOW_API_KEY = process.env.PAYNOW_API_KEY;          // "APIKey pnapi_v1_..."
    const PAYNOW_STORE_ID = process.env.PAYNOW_STORE_ID;        // e.g. ""
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!PAYNOW_API_KEY) return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    if (!PAYNOW_STORE_ID) return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });
    }
    if (!userUid || !email) {
      return NextResponse.json({ error: "Missing userUid/email" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Check our mapping first
    const { data: existingMap } = await supabase
      .from("paynow_customers")
      .select("*")
      .eq("firebase_uid", userUid)
      .maybeSingle();

    const base = `https://api.paynow.gg/v1/stores/${PAYNOW_STORE_ID}`;
    const headers = {
      Authorization: PAYNOW_API_KEY, // EXACT header required by Management API
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Helper: update PayNow customer's name if email changed
    async function ensureName(customerId: string) {
      try {
        await fetch(`${base}/customers/${customerId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ name: email, metadata: { email, uid: userUid } }),
        });
      } catch {}
    }

    if (existingMap?.paynow_customer_id) {
      // if email changed later, keep PayNow name in sync
      if (existingMap.email !== email) {
        await ensureName(existingMap.paynow_customer_id);
        await supabase
          .from("paynow_customers")
          .update({ email })
          .eq("firebase_uid", userUid);
      }
      return NextResponse.json(
        { customerId: existingMap.paynow_customer_id, created: false },
        { status: 200 }
      );
    }

    // 2) Try to FIND by name (email) to avoid duplicates in PayNow
    const lookupUrl = `${base}/customers/lookup?name=${encodeURIComponent(email)}`;
    const lookupResp = await fetch(lookupUrl, { method: "GET", headers });
    if (lookupResp.ok) {
      const found = await lookupResp.json();
      if (found?.id) {
        await supabase.from("paynow_customers").insert({
          firebase_uid: userUid,
          email,
          paynow_customer_id: String(found.id),
        });
        await ensureName(String(found.id));
        return NextResponse.json(
          { customerId: String(found.id), created: false },
          { status: 200 }
        );
      }
    }

    // 3) CREATE a new PayNow customer (use email as the visible "name")
    const createResp = await fetch(`${base}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: email,
        metadata: { email, uid: userUid, source: "xboard" },
      }),
    });

    const createdText = await createResp.text();
    if (!createResp.ok) {
      return NextResponse.json(
        { error: "Failed to create PayNow customer", detail: createdText, status: createResp.status },
        { status: 502 }
      );
    }

    const created = JSON.parse(createdText);
    const customerId = String(created?.id || "");

    if (!customerId) {
      return NextResponse.json({ error: "Create returned no id", raw: created }, { status: 502 });
    }

    await supabase.from("paynow_customers").insert({
      firebase_uid: userUid,
      email,
      paynow_customer_id: customerId,
    });

    return NextResponse.json({ customerId, created: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "upsert error" }, { status: 500 });
  }
}
