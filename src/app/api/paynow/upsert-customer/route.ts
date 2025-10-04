// app/api/paynow/customer/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/paynow/customer
 * Body: { customerToken?: string }   // OR header: x-paynow-customer-token
 * Returns: { customerId: string, raw: any }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const headerToken = req.headers.get("x-paynow-customer-token") || "";
    const customerToken = body.customerToken || headerToken;

    if (!customerToken) {
      return NextResponse.json(
        { error: "Missing customer token. Provide in body.customerToken or header x-paynow-customer-token." },
        { status: 400 }
      );
    }

    // Call PayNow Customer API
    const resp = await fetch("https://api.paynow.gg/v1/store/customer", {
      method: "GET",
      headers: {
        // IMPORTANT: this is a *Customer* token, not your management API key
        Authorization: `customer ${customerToken}`,
        Accept: "application/json",
      },
    });

    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch customer from PayNow", status: resp.status, detail: text },
        { status: 502 }
      );
    }

    const json = JSON.parse(text);
    // json.id is the PayNow customer_id (e.g., "477872717161304064")
    return NextResponse.json({ customerId: json?.id, raw: json }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "customer lookup error" }, { status: 500 });
  }
}
