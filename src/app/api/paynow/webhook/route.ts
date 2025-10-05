import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function plusOneMonth(from: Date) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYNOW_WEBHOOK_SECRET || "";
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // product-id → tier fallback (set these in Vercel)
    const GOLD_ID = process.env.PAYNOW_GOLD_PRODUCT_ID || "";
    const SILVER_ID = process.env.PAYNOW_SILVER_PRODUCT_ID || "";

    if (!secret) return NextResponse.json({ error: "Missing PAYNOW_WEBHOOK_SECRET" }, { status: 500 });
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // ----- exact raw body for HMAC -----
    const rawBody = await req.text();

    // ----- headers (case-insensitive) -----
    const sigHeader =
      req.headers.get("PayNow-Signature") ||
      req.headers.get("paynow-signature") ||
      req.headers.get("x-paynow-signature") ||
      "";
    const ts =
      req.headers.get("PayNow-Timestamp") ||
      req.headers.get("paynow-timestamp") ||
      req.headers.get("x-paynow-timestamp") ||
      "";

    if (!sigHeader) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    if (!ts) return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });

    // HMAC per docs: sha256(secret, `${ts}.${rawBody}`)
    const base = `${ts}.${rawBody}`;
    const expectedHex = crypto.createHmac("sha256", secret).update(base).digest("hex");
    const expectedB64 = crypto.createHmac("sha256", secret).update(base).digest("base64");
    const provided = sigHeader.replace(/^sha256=/i, "").trim();

    const ok =
      timingSafeEqual(provided, expectedHex) ||
      timingSafeEqual(provided, expectedB64);

    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    // optional replay guard (5m)
    const skew = Math.abs(Date.now() - Number(ts));
    if (!Number(ts) || skew > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Stale timestamp" }, { status: 408 });
    }

    // ----- parse after verify -----
    const evt = JSON.parse(rawBody);
    const type: string = evt?.event_type;
    const data: any = evt?.body || {};
    const now = new Date();

    // ----- reference: support many shapes -----
    const reference =
      data?.reference ||
      data?.metadata?.reference ||
      data?.order?.reference ||
      data?.order?.metadata?.reference ||
      data?.checkout?.reference ||
      data?.checkout?.metadata?.reference ||
      evt?.metadata?.reference ||
      "";

    if (!reference) {
      return NextResponse.json({ ok: true, note: "No reference; nothing to update." }, { status: 200 });
    }

    // Parse "srv=123|uid=abc"
    const params = new URLSearchParams(reference.replaceAll("|", "&"));
    const serverId = Number(params.get("srv") || "");
    const userUid = params.get("uid") || "";
    if (!serverId || !userUid) {
      return NextResponse.json({ error: "Missing serverId/userUid in reference" }, { status: 400 });
    }

    // ----- find product_id from common places -----
    const firstLine =
      data?.order?.lines?.[0] ||
      data?.lines?.[0] ||
      data?.checkout?.lines?.[0] ||
      null;

    const productId: string | undefined =
      firstLine?.product_id ||
      firstLine?.product?.id ||
      data?.product_id ||
      data?.product?.id ||
      undefined;

    // ----- broaden tier extraction -----
    const tierRaw: string =
      // typical subscription/product metadata
      data?.product?.metadata?.tier ||
      data?.plan?.metadata?.tier ||
      // line metadata / variables
      firstLine?.metadata?.tier ||
      firstLine?.variables?.tier ||
      // sometimes on order/checkout metadata
      data?.order?.metadata?.tier ||
      data?.metadata?.tier ||
      data?.checkout?.metadata?.tier ||
      "";

    let tier: "gold" | "silver" | null =
      tierRaw === "gold" || tierRaw === "silver" ? (tierRaw as any) : null;

    // Fallback: map by product_id if we still don't have a tier
    if (!tier && productId) {
      if (GOLD_ID && productId === GOLD_ID) tier = "gold";
      if (SILVER_ID && productId === SILVER_ID) tier = "silver";
    }

    const subscriptionId: string | undefined =
      data?.subscription_id || data?.id || data?.subscription?.id;

    const notes: string[] = [];
    notes.push(`type=${type}`);
    if (!tier) notes.push("no-tier-metadata");
    if (productId) notes.push(`product_id=${productId}`);

    // ---- handlers ----
    if (type === "ON_ORDER_COMPLETED") {
      if (!tier) {
        return NextResponse.json({ ok: true, note: `Order completed; ${notes.join(" | ")}` }, { status: 200 });
      }
      const expiresAt = plusOneMonth(now);

      // best-effort record
      const up1 = await supabase.from("server_subscriptions").upsert(
        {
          server_id: serverId,
          user_id: userUid,
          tier,
          provider: "paynow",
          provider_subscription_id: null,
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "provider_subscription_id" } // unique on this column is OK even if null
      );
      if (up1.error) notes.push(`upsert_subscriptions_err=${up1.error.message}`);

      const up2 = await supabase
        .from("servers")
        .update({ tier, tier_expires_at: expiresAt.toISOString() })
        .eq("id", serverId);
      if (up2.error) notes.push(`update_servers_err=${up2.error.message}`);

      return NextResponse.json({ ok: true, note: notes.join(" | ") }, { status: 200 });
    }

    if (type === "ON_SUBSCRIPTION_ACTIVATED" || type === "ON_SUBSCRIPTION_RENEWED") {
      if (!tier) return NextResponse.json({ error: "No tier metadata on product/line", extra: notes }, { status: 400 });

      const gatewayExpiry: string | undefined =
        data?.current_period_end || data?.expires_at || data?.period?.end;
      const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

      const up1 = await supabase.from("server_subscriptions").upsert(
        {
          server_id: serverId,
          user_id: userUid,
          tier,
          provider: "paynow",
          provider_subscription_id: subscriptionId || null,
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "provider_subscription_id" }
      );
      if (up1.error) notes.push(`upsert_subscriptions_err=${up1.error.message}`);

      const up2 = await supabase
        .from("servers")
        .update({ tier, tier_expires_at: expiresAt.toISOString() })
        .eq("id", serverId);
      if (up2.error) notes.push(`update_servers_err=${up2.error.message}`);

      return NextResponse.json({ ok: true, note: notes.join(" | ") }, { status: 200 });
    }

    if (type === "ON_SUBSCRIPTION_CANCELED") {
      const gatewayExpiry: string | undefined =
        data?.current_period_end || data?.expires_at || data?.period?.end;
      const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

      const up1 = await supabase
        .from("server_subscriptions")
        .update({ status: "canceled", expires_at: expiresAt.toISOString() })
        .eq("provider_subscription_id", subscriptionId || "");
      if (up1.error) notes.push(`update_subscriptions_err=${up1.error.message}`);

      const up2 = await supabase
        .from("servers")
        .update({ tier_expires_at: expiresAt.toISOString() })
        .eq("id", serverId);
      if (up2.error) notes.push(`update_servers_err=${up2.error.message}`);

      return NextResponse.json({ ok: true, note: notes.join(" | ") }, { status: 200 });
    }

    // ignore other events but ack
    return NextResponse.json({ received: true, note: notes.join(" | ") }, { status: 200 });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: e?.message || "Webhook error" }, { status: 500 });
  }
}
