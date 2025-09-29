import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// --- Supabase (server-side) ---
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// --- Safe compare to avoid timing leaks ---
function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// --- Map tier → cooldown hours ---
const COOLDOWN_HOURS: Record<"gold" | "silver", number> = {
  gold: 6,
  silver: 12,
};

// Extend an ISO time by one month (fallback if gateway doesn’t send expiry)
function plusOneMonth(from: Date) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYNOW_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });

    // 1) Read RAW body (required for HMAC)
    const rawBody = await req.text();

    // 2) Verify headers
    const sig = req.headers.get("paynow-signature") || "";
    const ts = req.headers.get("paynow-timestamp") || "";
    if (!sig || !ts) return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });

    // 3) Compute HMAC over raw body (if Paynow requires timestamp concatenation, adjust here)
    const h = crypto.createHmac("sha256", secret);
    h.update(rawBody);
    const computed = h.digest("hex");
    if (!timingSafeEqual(computed, sig)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 4) Anti-replay (5 minutes)
    const skew = Math.abs(Date.now() - Number(ts));
    if (!Number(ts) || skew > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Stale timestamp" }, { status: 408 });
    }

    // 5) Parse JSON *after* verifying signature
    const evt = JSON.parse(rawBody);
    const type: string = evt?.event_type;
    const data: any = evt?.body || {};

    // We expect body to contain:
    // - product / plan info with our metadata tier (gold/silver)
    // - subscription_id (for recurring)
    // - order_id (initial payment)
    // - customer info (we’ll use a custom reference you pass when creating checkout, or map later)
    //
    // IMPORTANT: We need to know WHICH community/server and WHICH user this payment is for.
    // Easiest way:
    //   When you build the Paynow checkout link/button for a community page,
    //   include a "reference" (a string) that contains server_id and user_uid, e.g. "srv=23|uid=MWw9...".
    //   Paynow sends that reference back in the webhook body. We then parse it here.
    //
    const reference: string | undefined = data?.reference || data?.metadata?.reference;

    // Fallbacks if reference is not yet wired: you can also match by product metadata tier + the page (NOT recommended).
    if (!reference) {
      // If you haven't wired `reference` yet, accept the event but do nothing irreversible.
      return NextResponse.json({ ok: true, note: "No reference in payload; nothing to update." }, { status: 200 });
    }

    // Parse "srv=123|uid=abc"
    const parts = new URLSearchParams(reference.replaceAll("|", "&"));
    const serverId = Number(parts.get("srv") || "");
    const userUid = parts.get("uid") || ""; // this should be users.firebase_uid

    if (!serverId || !userUid) {
      return NextResponse.json({ error: "Missing serverId/userUid in reference" }, { status: 400 });
    }

    // Determine tier (via product metadata/variables)
    // Your product should send something like data.product.metadata.tier or data.variables.tier
    const tierRaw: string =
      data?.product?.metadata?.tier ||
      data?.variables?.tier ||
      data?.plan?.metadata?.tier ||
      "";

    const tier = (tierRaw === "gold" || tierRaw === "silver") ? tierRaw : null;

    // Subscription identifiers
    const subscriptionId: string | undefined = data?.subscription_id || data?.id || data?.subscription?.id;
    const now = new Date();

    switch (type) {
      case "ON_ORDER_COMPLETED":
        // Initial charge succeeded (for one-time or the first cycle)
        // If this is the first subscription payment, the gateway will usually also send ACTIVATED.
        // We can no-op here or record an order row if you like.
        break;

      case "ON_SUBSCRIPTION_ACTIVATED":
      case "ON_SUBSCRIPTION_RENEWED": {
        if (!tier) {
          return NextResponse.json({ error: "No tier metadata on product" }, { status: 400 });
        }
        // Compute/derive expiry (prefer gateway-provided, otherwise +1 month)
        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        // 1) Upsert subscription record
        await supabase
          .from("server_subscriptions")
          .upsert(
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

        // 2) Update server tier & expiry
        await supabase
          .from("servers")
          .update({
            tier: tier as "gold" | "silver",
            tier_expires_at: expiresAt.toISOString(),
          })
          .eq("id", serverId);

        // (Cooldown is enforced by your promote API using promotions table; we’re not changing that.)
        break;
      }

      case "ON_SUBSCRIPTION_CANCELED": {
        // We keep benefits until period end.
        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        // Mark subscription canceled but still active until expiry.
        await supabase
          .from("server_subscriptions")
          .update({
            status: "canceled",
            expires_at: expiresAt.toISOString(),
          })
          .eq("provider_subscription_id", subscriptionId || "");

        // Update only the expiry on server; do NOT downgrade yet.
        await supabase
          .from("servers")
          .update({ tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        break;   
      }
    
      default:
        // Ignore unhandled types
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    // Return 500 so Paynow retries
    return NextResponse.json({ error: e.message || "Webhook error" }, { status: 500 });
  }
}
