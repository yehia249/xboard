import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/paynow/create
 * Body: { productId: string, tier: "gold"|"silver", serverId: number, userUid: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { productId, tier, serverId, userUid } = await req.json();

    if (!process.env.PAYNOW_API_KEY) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!productId || !tier || !serverId || !userUid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // This matches what your webhook expects to parse
    const reference = `srv=${serverId}|uid=${userUid}`;

    const resp = await fetch("https://api.paynow.gg/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: process.env.PAYNOW_API_KEY!,
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify({
          lines: [
            {
              product_id: productId,
              subscription: true,
              quantity: 1,
              metadata: { tier },
            },
          ],
          return_url: "https://xboardz.com/upgrade/success",
          cancel_url: "https://xboardz.com/upgrade/cancel",
          auto_redirect: true,
          metadata: { reference },
        }),
      });
      

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: "Paynow error", detail: text }, { status: 502 });
    }

    const data = await resp.json(); // { id, token, url }
    return NextResponse.json({ url: data.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "failed" }, { status: 500 });
  }
}
