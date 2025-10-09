import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- helpers ---------- */

function timingSafeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function plus30Days(from: Date) {
  // strict 30 days, independent of month length
  return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function isExpired(d?: Date | string | null) {
  if (!d) return true;
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.getTime() <= Date.now();
}

function getHeader(req: NextRequest, key: string) {
  return (
    req.headers.get(key) ||
    req.headers.get(key.toLowerCase()) ||
    req.headers.get(`x-${key.toLowerCase()}`) ||
    ""
  );
}

// Try very hard to find "tier" in payload
function deepFindTier(obj: any, path = "evt"): string {
  if (!obj || typeof obj !== "object") return "";
  if (obj.tier) return obj.tier;
  if (obj.metadata?.tier) return obj.metadata.tier;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const r = deepFindTier(obj[i], `${path}[${i}]`);
      if (r) return r;
    }
  }
  const keys = ["lines", "order", "checkout", "product", "plan", "data", "body"];
  for (const k of keys) {
    if (obj[k]) {
      const r = deepFindTier(obj[k], `${path}.${k}`);
      if (r) return r;
    }
  }
  return "";
}

function parseReference(ref: string) {
  // we store "srv=123|uid=abc"
  const params = new URLSearchParams(ref.replaceAll("|", "&"));
  const serverId = Number(params.get("srv") || "");
  const userUid = params.get("uid") || "";
  return { serverId, userUid };
}

// choose a non-null id for one-time orders to make upsert idempotent
function getStableOneTimeId(data: any, fallbackRef: string, timestampMs: number) {
  return (
    data?.order?.id ||
    data?.id ||
    `order:${fallbackRef}:${timestampMs}` // final fallback
  );
}

async function ensureNormalizedServer(
  supabase: SupabaseClient,
  serverId: number
) {
  const { data: s, error } = await supabase
    .from("servers")
    .select("tier, tier_expires_at")
    .eq("id", serverId)
    .single();
  if (error || !s) return;
  const expired = isExpired(s.tier_expires_at);
  if (expired && s.tier !== "normal") {
    await supabase
      .from("servers")
      .update({ tier: "normal", tier_expires_at: null })
      .eq("id", serverId);
    console.log("⬇️ Downgraded server", serverId, "back to 'normal'");
  }
}

/* ---------- webhook ---------- */

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYNOW_WEBHOOK_SECRET || "";
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!secret)
      return NextResponse.json(
        { error: "Missing PAYNOW_WEBHOOK_SECRET" },
        { status: 500 }
      );
    if (!supabaseUrl || !supabaseKey)
      return NextResponse.json(
        { error: "Missing Supabase envs" },
        { status: 500 }
      );

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // --- exact raw body for HMAC ---
    const rawBody = await req.text();

    // --- signature verify ---
    const sigHeader = getHeader(req, "PayNow-Signature");
    const tsHeader = getHeader(req, "PayNow-Timestamp");
    if (!sigHeader)
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    if (!tsHeader)
      return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });

    const base = `${tsHeader}.${rawBody}`;
    const expectedHex = crypto
      .createHmac("sha256", secret)
      .update(base)
      .digest("hex");
    const expectedB64 = crypto
      .createHmac("sha256", secret)
      .update(base)
      .digest("base64");
    const provided = sigHeader.replace(/^sha256=/i, "").trim();
    const okSig =
      timingSafeEqual(provided, expectedHex) ||
      timingSafeEqual(provided, expectedB64);
    if (!okSig)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const tsNum = Number(tsHeader);
    const skew = Math.abs(Date.now() - tsNum);
    if (!tsNum || skew > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Stale timestamp" }, { status: 408 });
    }

    // parse AFTER verify
    const evt = JSON.parse(rawBody);
    console.log("🔔 PayNow Webhook:", JSON.stringify(evt, null, 2));

    const type: string = evt?.event_type;
    const data: any = evt?.body || evt?.data || {};
    const now = new Date();

    // reference
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
      console.warn("⚠️ No reference in webhook -> nothing to update");
      return NextResponse.json(
        { ok: true, note: "No reference" },
        { status: 200 }
      );
    }
    const { serverId, userUid } = parseReference(reference);
    if (!serverId || !userUid) {
      return NextResponse.json(
        { error: "Missing serverId/userUid in reference" },
        { status: 400 }
      );
    }

    // tier
    let tier =
      data?.product?.metadata?.tier ||
      data?.variables?.tier ||
      data?.plan?.metadata?.tier ||
      data?.order?.lines?.[0]?.metadata?.tier ||
      data?.lines?.[0]?.metadata?.tier ||
      data?.checkout?.lines?.[0]?.metadata?.tier ||
      data?.metadata?.tier ||
      evt?.metadata?.tier ||
      evt?.lines?.[0]?.metadata?.tier ||
      evt?.body?.lines?.[0]?.metadata?.tier ||
      deepFindTier(evt) ||
      null;
    if (tier !== "gold" && tier !== "silver") {
      tier = null;
    }

    // subscription id (if a subscription event)
    const subscriptionId: string | undefined =
      data?.subscription_id || data?.id || data?.subscription?.id;

    console.log(
      "🎯 Event:",
      type,
      "| Tier:",
      tier,
      "| Server:",
      serverId,
      "| User:",
      userUid
    );

    switch (type) {
      /* ---------- ONE-TIME ORDERS ---------- */
      case "ON_ORDER_COMPLETED": {
        if (!tier) {
          console.error("❌ Order completed but no tier found");
          return NextResponse.json(
            { ok: true, note: "No tier on one-time order" },
            { status: 200 }
          );
        }
        const expiresAt = plus30Days(now);
        const oneTimeId = getStableOneTimeId(data, reference, tsNum);

        // idempotent upsert
        const { error: upsertErr } = await supabase
          .from("server_subscriptions")
          .upsert(
            {
              server_id: serverId,
              user_id: userUid,
              tier,
              provider: "paynow",
              provider_subscription_id: oneTimeId, // non-null
              status: "active",
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "provider_subscription_id" }
          );
        if (upsertErr) console.error("❌ upsert one-time:", upsertErr);

        const { error: sErr } = await supabase
          .from("servers")
          .update({ tier, tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);
        if (sErr) console.error("❌ update server tier:", sErr);
        break;
      }

      /* ---------- SUBSCRIPTIONS (ACTIVATE / RENEW) ---------- */
      case "ON_SUBSCRIPTION_ACTIVATED":
      case "ON_SUBSCRIPTION_RENEWED": {
        if (!tier) {
          return NextResponse.json(
            { error: "No tier metadata on subscription product" },
            { status: 400 }
          );
        }
        // Prefer gateway period end if provided
        const gatewayEndStr: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        let expiresAt: Date;
        if (gatewayEndStr) {
          expiresAt = new Date(gatewayEndStr);
        } else {
          // extend from latest of existing expiry or now
          const { data: existing } = await supabase
            .from("server_subscriptions")
            .select("expires_at")
            .eq("provider_subscription_id", subscriptionId || "")
            .single();
          const base = existing?.expires_at
            ? new Date(existing.expires_at)
            : now;
          expiresAt = base > now ? plus30Days(base) : plus30Days(now);
        }

        const { error: upsertErr } = await supabase
          .from("server_subscriptions")
          .upsert(
            {
              server_id: serverId,
              user_id: userUid,
              tier,
              provider: "paynow",
              provider_subscription_id:
                subscriptionId || `sub:${reference}:${tsNum}`,
              status: "active",
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "provider_subscription_id" }
          );
        if (upsertErr) console.error("❌ upsert subscription:", upsertErr);

        const { error: sErr } = await supabase
          .from("servers")
          .update({ tier, tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);
        if (sErr) console.error("❌ update server:", sErr);
        break;
      }

      /* ---------- SUBSCRIPTION CANCELED ---------- */
      case "ON_SUBSCRIPTION_CANCELED": {
        // 1) Try to get the period end from the gateway
        const gatewayEndStr =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        // 2) Otherwise, use what we already know in DB (expires_at or started_at + 30d)
        const { data: existing } = await supabase
          .from("server_subscriptions")
          .select("expires_at, started_at")
          .eq("provider_subscription_id", subscriptionId || "")
          .single();
        // 3) As another fallback, look at the server’s visible expiry (if any)
        const { data: s } = await supabase
          .from("servers")
          .select("tier_expires_at")
          .eq("id", serverId)
          .single();

        let expiresAt: Date | null = null;
        if (gatewayEndStr) {
          // Gateway told us the exact end of the current period
          expiresAt = new Date(gatewayEndStr);
        } else if (existing?.expires_at) {
          // Use the expiry we stored when the sub was activated/renewed
          expiresAt = new Date(String(existing.expires_at));
        } else if (existing?.started_at) {
          // Infer one full cycle from the start (strict 30 days)
          expiresAt = plus30Days(new Date(String(existing.started_at)));
        } else if (s?.tier_expires_at) {
          // Last resort: mirror whatever the server shows
          expiresAt = new Date(String(s.tier_expires_at));
        } else {
          // We don't know any remaining time → no free extension
          expiresAt = new Date();
        }

        // 4) Mark subscription as canceled, but keep the expiry
        await supabase
          .from("server_subscriptions")
          .update({ status: "canceled", expires_at: expiresAt.toISOString() })
          .eq("provider_subscription_id", subscriptionId || "");

        // 5) Keep the tier active until expiry; if already past, downgrade now
        if (isExpired(expiresAt)) {
          await supabase
            .from("servers")
            .update({ tier: "normal", tier_expires_at: null })
            .eq("id", serverId);
        } else {
          await supabase
            .from("servers")
            .update({ tier_expires_at: expiresAt.toISOString() })
            .eq("id", serverId);
        }
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", type);
        break;
    }

    // Final safety: if it's past due for this server, normalize now.
    await ensureNormalizedServer(supabase, serverId);

    console.log("✅ Webhook processed");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("❌ Webhook error:", e);
    return NextResponse.json(
      { error: e?.message || "Webhook error" },
      { status: 500 }
    );
  }
}
