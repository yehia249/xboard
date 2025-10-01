import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/create
 * Body: { productId: string, tier: "gold"|"silver", serverId: number, userUid: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { productId, tier, serverId, userUid } = await req.json();

    // Validate environment
    if (!process.env.PAYNOW_API_KEY) {
      console.error("Missing PAYNOW_API_KEY");
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }

    // Validate input
    if (!productId || !tier || !serverId || !userUid) {
      console.error("Missing fields:", { productId, tier, serverId, userUid });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // This matches what your webhook expects to parse
    const reference = `srv=${serverId}|uid=${userUid}`;

    console.log("Creating checkout with:", { productId, tier, serverId, userUid, reference });

    const payload = {
      lines: [
        {
          product_id: productId,
          subscription: true,
          quantity: 1,
          metadata: { tier }, // Keep tier in line metadata for your use
        },
      ],
      return_url: "https://xboardz.com/upgrade/success",
      cancel_url: "https://xboardz.com/upgrade/cancel",
      auto_redirect: true,
      metadata: { 
        reference, // This is what your webhook will read
        tier,
        serverId: String(serverId),
        userUid,
      },
    };

    console.log("Paynow payload:", JSON.stringify(payload, null, 2));

    const resp = await fetch("https://api.paynow.gg/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYNOW_API_KEY}`, // Try with Bearer prefix
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await resp.text();
    console.log("Paynow response status:", resp.status);
    console.log("Paynow response body:", responseText);

    if (!resp.ok) {
      console.error("Paynow API error:", responseText);
      return NextResponse.json(
        { 
          error: "Paynow checkout creation failed", 
          detail: responseText,
          status: resp.status 
        }, 
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Paynow response:", e);
      return NextResponse.json(
        { error: "Invalid response from Paynow", detail: responseText },
        { status: 502 }
      );
    }

    if (!data.url) {
      console.error("No URL in Paynow response:", data);
      return NextResponse.json(
        { error: "No checkout URL returned", detail: JSON.stringify(data) },
        { status: 502 }
      );
    }

    console.log("Checkout created successfully:", data.url);
    return NextResponse.json({ url: data.url }, { status: 200 });

  } catch (e: any) {
    console.error("Checkout creation error:", e);
    return NextResponse.json(
      { error: e.message ?? "Unknown error", detail: e.stack },
      { status: 500 }
    );
  }
}