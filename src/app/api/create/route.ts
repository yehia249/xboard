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
    if (!process.env.PAYNOW_API_KEY) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!process.env.PAYNOW_STORE_ID) {
      return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    }
    if (!productId || !tier || !serverId || !userUid || !customerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ---- build dynamic return/cancel URLs
    // Prefer an explicit base URL from env; fall back to request origin; final fallback is prod domain.
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "https://xboardz.com";

    const returnUrl = `${origin}/community/${serverId}`; // success redirect
    const cancelUrl = `${origin}/upgrade/${serverId}`;   // cancel redirect

    const reference = `srv=${serverId}|uid=${userUid}`;
    const url = `https://api.paynow.gg/v1/stores/${process.env.PAYNOW_STORE_ID}/checkouts`;

    // ONE-TIME product for quick test (Gold) → not a subscription
    const ONE_TIME_GOLD_ID = "478332020456427520";
    const isSubscription = productId !== ONE_TIME_GOLD_ID;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: process.env.PAYNOW_API_KEY!, // management key (use Bearer if your key format requires it)
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
        // Key part: send them back to the specific community page (success) or upgrade page (cancel)
        return_url: returnUrl,
        cancel_url: cancelUrl,
        auto_redirect: true,
        metadata: { reference },
        customer_id: customerId, // REQUIRED
      }),
    });

    const responseText = await resp.text();
    if (!resp.ok) {
      return NextResponse.json(
        { error: "Paynow error", detail: responseText, status: resp.status },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({ url: data.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "failed" }, { status: 500 });
  }
}
