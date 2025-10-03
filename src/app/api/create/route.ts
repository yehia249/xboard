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

    // Get customer IP from the request
    const customerIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                       req.headers.get("x-real-ip") || 
                       "127.0.0.1";

    // This matches what your webhook expects to parse
    const reference = `srv=${serverId}|uid=${userUid}`;

    console.log("Making PayNow API request with:", {
      productId,
      tier,
      serverId,
      userUid,
      customerIp,
    });

    const resp = await fetch("https://api.paynow.gg/v1/checkouts", {
      method: "POST",
      headers: {
        // Try without Bearer prefix - just the raw API key
        "Authorization": process.env.PAYNOW_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-paynow-customer-ip": customerIp,
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

    const responseText = await resp.text();
    console.log("PayNow API response status:", resp.status);
    console.log("PayNow API response:", responseText);

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Paynow error", detail: responseText, status: resp.status }, 
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({ url: data.url }, { status: 200 });
  } catch (e: any) {
    console.error("PayNow checkout creation failed:", e);
    return NextResponse.json(
      { error: e.message ?? "failed" }, 
      { status: 500 }
    );
  }
}