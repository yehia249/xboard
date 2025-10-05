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
    if (!secret) return NextResponse.json({ error: "Missing PAYNOW_WEBHOOK_SECRET" }, { status: 500 });
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // --- exact raw body for HMAC ---
    const rawBody = await req.text();

    // --- headers (case-insensitive) ---
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

    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // optional replay guard (5m)
    const skew = Math.abs(Date.now() - Number(ts));
    if (!Number(ts) || skew > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Stale timestamp" }, { status: 408 });
    }

    // --- parse after verify ---
    const evt = JSON.parse(rawBody);
    const type: string = evt?.event_type;
    const data: any = evt?.body || {};
    const now = new Date();

    // ---- reference (support multiple shapes) ----testt
    const reference =
      data?.reference ||
      data?.metadata?.reference ||
      data?.checkout?.reference ||
      data?.checkout?.metadata?.reference ||
      data?.order?.reference ||
      data?.order?.metadata?.reference ||
      evt?.metadata?.reference ||
      "";

    if (!reference) {
      // Nothing we can map to a server/user — just ack success so PayNow stops retrying
      return NextResponse.json({ ok: true, note: "No reference; nothing to update." }, { status: 200 });
    }

    // Parse "srv=123|uid=abc"
    const params = new URLSearchParams(reference.replaceAll("|", "&"));
    const serverId = Number(params.get("srv") || "");
    const userUid = params.get("uid") || "";
    if (!serverId || !userUid) {
      return NextResponse.json({ error: "Missing serverId/userUid in reference" }, { status: 400 });
    }

    // ---- tier lookup (both subscription + one-time shapes) ----
    const tierRaw: string =
      data?.product?.metadata?.tier ||
      data?.variables?.tier ||
      data?.plan?.metadata?.tier ||
      data?.order?.lines?.[0]?.metadata?.tier ||
      data?.lines?.[0]?.metadata?.tier ||
      "";
    const tier = tierRaw === "gold" || tierRaw === "silver" ? tierRaw : null;

    const subscriptionId: string | undefined =
      data?.subscription_id || data?.id || data?.subscription?.id;

    switch (type) {
      case "ON_ORDER_COMPLETED": {
        if (!tier) {
          return NextResponse.json({ ok: true, note: "Order completed without tier metadata." }, { status: 200 });
        }
        const expiresAt = plusOneMonth(now);

        // record (best-effort)
        try {
          await supabase.from("server_subscriptions").upsert(
            {
              server_id: serverId,
              user_id: userUid,
              tier: tier as "gold" | "silver",
              provider: "paynow",
              provider_subscription_id: null,
              status: "active",
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "provider_subscription_id" }
          );
        } catch (e) {
          console.error("upsert one-time failed:", e);
        }

        await supabase
          .from("servers")
          .update({ tier: tier as "gold" | "silver", tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        break;
      }

      case "ON_SUBSCRIPTION_ACTIVATED":
      case "ON_SUBSCRIPTION_RENEWED": {
        if (!tier) return NextResponse.json({ error: "No tier metadata on product" }, { status: 400 });

        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        await supabase.from("server_subscriptions").upsert(
          {
            server_id: serverId,
            user_id: userUid,
            tier: tier as "gold" | "silver",
            provider: "paynow",
            provider_subscription_id: subscriptionId || null,
            status: "active",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: "provider_subscription_id" }
        );

        await supabase
          .from("servers")
          .update({ tier: tier as "gold" | "silver", tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        break;
      }

      case "ON_SUBSCRIPTION_CANCELED": {
        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        await supabase
          .from("server_subscriptions")
          .update({ status: "canceled", expires_at: expiresAt.toISOString() })
          .eq("provider_subscription_id", subscriptionId || "");

        await supabase
          .from("servers")
          .update({ tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: e?.message || "Webhook error" }, { status: 500 });
  }
}