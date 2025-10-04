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

    if (!process.env.PAYNOW_API_KEY) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!process.env.PAYNOW_STORE_ID) {
      return NextResponse.json({ error: "Missing PAYNOW_STORE_ID" }, { status: 500 });
    }
    if (!productId || !tier || !serverId || !userUid || !customerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const reference = `srv=${serverId}|uid=${userUid}`;
    const url = `https://api.paynow.gg/v1/stores/${process.env.PAYNOW_STORE_ID}/checkouts`;

    // ONE-TIME product for quick test (Gold):
    const ONE_TIME_GOLD_ID = "478332020456427520";
    const isSubscription = productId !== ONE_TIME_GOLD_ID;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: process.env.PAYNOW_API_KEY!, // management key
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
        return_url: "https://xboardz.com/upgrade/success",
        cancel_url: "https://xboardz.com/upgrade/cancel",
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
