import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/paynow/upsert-customer
 * Body: { userUid: string, name?: string }
 * Returns: { customerId: string, created: boolean, raw?: any }
 */
export async function POST(req: NextRequest) {
  try {
    const { userUid, name } = await req.json();

    if (!process.env.PAYNOW_API_KEY) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!process.env.PAYNOW_STORE_ID) {
      return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    }
    if (!userUid) {
      return NextResponse.json({ error: "Missing userUid" }, { status: 400 });
    }

    const base = `https://api.paynow.gg/v1/stores/${process.env.PAYNOW_STORE_ID}`;
    const headers = {
      Authorization: process.env.PAYNOW_API_KEY!, // e.g. "apikey pnapi_v1_..."
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // 1) Try to find by external_id (some tenants expose a filter; handle both list/single)
    const findUrl = `${base}/customers?external_id=${encodeURIComponent(userUid)}`;
    const findResp = await fetch(findUrl, { method: "GET", headers });
    if (findResp.ok) {
      const txt = await findResp.text();
      try {
        const json = JSON.parse(txt);
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : null;

        if (list && list.length > 0 && list[0]?.id) {
          return NextResponse.json(
            { customerId: String(list[0].id), created: false, raw: list[0] },
            { status: 200 }
          );
        }
        if (!list && json?.id) {
          return NextResponse.json(
            { customerId: String(json.id), created: false, raw: json },
            { status: 200 }
          );
        }
      } catch {
        // fall through to create
      }
    }

    // 2) Create if not found
    const createResp = await fetch(`${base}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        external_id: String(userUid),
        name: name || "XBoard User",
        metadata: { source: "xboard", uid: String(userUid) },
      }),
    });

    const createText = await createResp.text();
    if (!createResp.ok) {
      return NextResponse.json(
        { error: "Failed to create PayNow customer", status: createResp.status, detail: createText },
        { status: 502 }
      );
    }

    const created = JSON.parse(createText);
    const customerId = String(created?.id || created?.customer_id || "");
    if (!customerId) {
      return NextResponse.json(
        { error: "Create returned no id", raw: created },
        { status: 502 }
      );
    }

    return NextResponse.json({ customerId, created: true, raw: created }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "upsert error" }, { status: 500 });
  }
}
