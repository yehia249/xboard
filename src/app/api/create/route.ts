// app/api/create/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/create
 * Body: { productId: string, tier: "gold"|"silver", serverId: number, userUid: string, customerId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { productId, tier, serverId, userUid, customerId } = await req.json();

    // ---- env checks
    const PAYNOW_API_KEY = process.env.PAYNOW_API_KEY;
    const PAYNOW_STORE_ID = process.env.PAYNOW_STORE_ID;

    if (!PAYNOW_API_KEY) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!PAYNOW_STORE_ID) {
      return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    }
    if (!productId || !tier || !serverId || !userUid || !customerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ---- build dynamic return/cancel URLs
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "https://xboardz.com";

    const returnUrl = `${origin}/community/${serverId}`;
    const cancelUrl = `${origin}/community/${serverId}/upgrade`;

    const reference = `srv=${serverId}|uid=${userUid}`;
    const url = `https://api.paynow.gg/v1/stores/${PAYNOW_STORE_ID}/checkouts`;

    // if you really have a one-time product you want to treat differently, keep this
    const ONE_TIME_GOLD_ID = "478332020456427520";
    const isSubscription = productId !== ONE_TIME_GOLD_ID;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        // most endpoints expect Bearer
        Authorization: `Bearer ${PAYNOW_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        lines: [
          {
            product_id: productId,
            subscription: isSubscription,
            quantity: 1,
            metadata: { tier },
          },
        ],
        return_url: returnUrl,
        cancel_url: cancelUrl,
        // IMPORTANT: for iframe flow we do NOT auto redirect
        auto_redirect: false,
        metadata: { reference },
        customer_id: customerId,
      }),
    });

    const responseText = await resp.text();
    if (!resp.ok) {
      return NextResponse.json(
        { error: "PayNow error", detail: responseText, status: resp.status },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);
    // PayNow.js wants a "checkout token"
    // we return both just in case the response has url too
    const token =
      data.token ||
      data.checkout_token ||
      data.id || // fallback if their API names it differently
      null;

    if (!token) {
      // last resort: send whole payload to debug
      return NextResponse.json(
        { error: "No checkout token in response", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        token,
        url: data.url ?? null, // not used by iframe, but nice to have
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "failed" }, { status: 500 });
  }
}
