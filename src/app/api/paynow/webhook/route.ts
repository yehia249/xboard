import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Make sure we're on Node (not Edge)
export const runtime = "nodejs";
// Avoid static optimization
export const dynamic = "force-dynamic";

// --- Safe compare to avoid timing leaks ---
function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Map tier → cooldown hours (kept if you use it later)
const COOLDOWN_HOURS: Record<"gold" | "silver", number> = { gold: 6, silver: 12 };

function plusOneMonth(from: Date) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    // ----- ENV (read at runtime) -----
    const secret = process.env.PAYNOW_WEBHOOK_SECRET || "";
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!secret) {
      return NextResponse.json({ error: "Missing PAYNOW_WEBHOOK_SECRET" }, { status: 500 });
    }
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });
    }

    // ----- Create Supabase client -----
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // 1) Read RAW body (required for HMAC)
    const rawBody = await req.text();

    // 2) Verify headers
    const sig = req.headers.get("paynow-signature") || "";
    const ts = req.headers.get("paynow-timestamp") || "";
    if (!sig || !ts) return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });

    // 3) Verify HMAC
    const h = crypto.createHmac("sha256", secret);
    h.update(`${ts}.${rawBody}`);
    const computed = h.digest("hex");
    if (!timingSafeEqual(computed, sig)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 4) Anti-replay (5 min window)
    const skew = Math.abs(Date.now() - Number(ts));
    if (!Number(ts) || skew > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Stale timestamp" }, { status: 408 });
    }

    // 5) Parse JSON after verification
    const evt = JSON.parse(rawBody);
    const type: string = evt?.event_type;
    const data: any = evt?.body || {};

    // Identify server & user via reference we appended to the Paynow link
    const reference: string | undefined = data?.reference || data?.metadata?.reference;
    if (!reference) {
      return NextResponse.json({ ok: true, note: "No reference in payload; nothing to update." }, { status: 200 });
    }

    // Parse "srv=123|uid=abc"
    const parts = new URLSearchParams(reference.replaceAll("|", "&"));
    const serverId = Number(parts.get("srv") || "");
    const userUid = parts.get("uid") || "";
    if (!serverId || !userUid) {
      return NextResponse.json({ error: "Missing serverId/userUid in reference" }, { status: 400 });
    }

    // Tier from metadata
    const tierRaw: string =
      data?.product?.metadata?.tier ||
      data?.variables?.tier ||
      data?.plan?.metadata?.tier ||
      data?.order?.lines?.[0]?.metadata?.tier || // added for one-time orders
      data?.lines?.[0]?.metadata?.tier ||        // alternate shape
      "";
    const tier = (tierRaw === "gold" || tierRaw === "silver") ? tierRaw : null;

    const subscriptionId: string | undefined = data?.subscription_id || data?.id || data?.subscription?.id;
    const now = new Date();

    switch (type) {
      // ---------------- ONE-TIME PURCHASES ----------------
      case "ON_ORDER_COMPLETED": {
        if (!tier) {
          return NextResponse.json({ ok: true, note: "Order completed without tier metadata." }, { status: 200 });
        }

        const expiresAt = plusOneMonth(now);

        try {
          await supabase
            .from("server_subscriptions")
            .upsert(
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
        } catch (err) {
          console.error("Failed to upsert one-time subscription:", err);
        }

        await supabase
          .from("servers")
          .update({ tier: tier as "gold" | "silver", tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        break;
      }

      // ---------------- SUBSCRIPTIONS ----------------
      case "ON_SUBSCRIPTION_ACTIVATED":
      case "ON_SUBSCRIPTION_RENEWED": {
        if (!tier) return NextResponse.json({ error: "No tier metadata on product" }, { status: 400 });

        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

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

        await supabase
          .from("servers")
          .update({ tier: tier as "gold" | "silver", tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        break;
      }

      // ---------------- CANCELLATIONS ----------------
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
    return NextResponse.json({ error: e.message || "Webhook error" }, { status: 500 });
  }
}
