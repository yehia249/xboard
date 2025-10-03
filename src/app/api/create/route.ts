// src/app/api/paynow/create/route.ts
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

    const apiKey = (process.env.PAYNOW_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing PAYNOW_API_KEY" }, { status: 500 });
    }
    if (!productId || !tier || !serverId || !userUid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Reference string that your webhook parses into serverId/userUid
    const reference = `srv=${serverId}|uid=${userUid}`;

    // Best-effort customer IP (required by Paynow when not called from the browser)
    // On Vercel/Node, the client IP is usually in x-forwarded-for: "ip, proxy1, proxy2"
    const fwd = req.headers.get("x-forwarded-for") || "";
    const customerIp = fwd.split(",")[0]?.trim() || "0.0.0.0"; // fallback if missing

    const resp = await fetch("https://api.paynow.gg/v1/checkouts", {
      method: "POST",
      headers: {
        // IMPORTANT: include "Bearer " prefix
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "*/*",

        // Required when request is not from the customer browser
        "x-paynow-customer-ip": customerIp,

        // Optional but recommended if you know it (ISO 3166-1 alpha-2)
        // Set to your best guess; override from client if you have it
        "x-paynow-customer-countrycode": "EG",
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
      // Pass through Paynow's error for easier debugging
      const text = await resp.text();
      return NextResponse.json(
        { error: "Paynow error", detail: text },
        { status: 502 }
      );
    }

    const data = await resp.json(); // { id, token, url }
    return NextResponse.json({ url: data.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "failed" }, { status: 500 });
  }
}
