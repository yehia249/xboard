import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function plusOneMonth(from: Date) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    // ENV
    const secret = process.env.PAYNOW_WEBHOOK_SECRET || "";
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!secret) {
      console.error("Missing PAYNOW_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Missing PAYNOW_WEBHOOK_SECRET" }, { status: 500 });
    }
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json({ error: "Missing Supabase envs" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // 1) Read RAW body
    const rawBody = await req.text();
    console.log("Webhook received, body length:", rawBody.length);

    // 2) Verify headers
    const sig = req.headers.get("paynow-signature") || "";
    const ts = req.headers.get("paynow-timestamp") || "";
    
    if (!sig || !ts) {
      console.error("Missing signature headers");
      return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
    }

    // 3) Verify HMAC
    const h = crypto.createHmac("sha256", secret);
    h.update(`${ts}.${rawBody}`);
    const computed = h.digest("hex");
    
    if (!timingSafeEqual(computed, sig)) {
      console.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 4) Anti-replay
    const skew = Math.abs(Date.now() - Number(ts));
    if (!Number(ts) || skew > 5 * 60 * 1000) {
      console.error("Stale timestamp, skew:", skew);
      return NextResponse.json({ error: "Stale timestamp" }, { status: 408 });
    }

    // 5) Parse event
    const evt = JSON.parse(rawBody);
    const type: string = evt?.event_type;
    const data: any = evt?.body || {};

    console.log("Webhook event:", type);
    console.log("Event data:", JSON.stringify(data, null, 2));

    // Extract reference - check multiple possible locations
    const reference: string = 
      data?.metadata?.reference ||
      data?.reference || 
      data?.checkout?.metadata?.reference ||
      "";

    if (!reference) {
      console.warn("No reference in webhook payload");
      return NextResponse.json({ 
        ok: true, 
        note: "No reference in payload; nothing to update." 
      }, { status: 200 });
    }

    console.log("Reference found:", reference);

    // Parse "srv=123|uid=abc"
    const parts = new URLSearchParams(reference.replaceAll("|", "&"));
    const serverId = Number(parts.get("srv") || "");
    const userUid = parts.get("uid") || "";

    if (!serverId || !userUid) {
      console.error("Invalid reference format:", reference);
      return NextResponse.json({ 
        error: "Missing serverId/userUid in reference" 
      }, { status: 400 });
    }

    console.log("Parsed reference:", { serverId, userUid });

    // Extract tier
    const tierRaw: string =
      data?.metadata?.tier ||
      data?.lines?.[0]?.metadata?.tier ||
      data?.product?.metadata?.tier ||
      data?.variables?.tier ||
      data?.plan?.metadata?.tier ||
      "";
    
    const tier = (tierRaw === "gold" || tierRaw === "silver") ? tierRaw : null;
    console.log("Tier extracted:", tier);

    const subscriptionId: string | undefined = 
      data?.subscription_id || 
      data?.id || 
      data?.subscription?.id;
    
    console.log("Subscription ID:", subscriptionId);

    const now = new Date();

    switch (type) {
      case "ON_ORDER_COMPLETED":
        console.log("Order completed, no action needed");
        break;

      case "ON_SUBSCRIPTION_ACTIVATED":
      case "ON_SUBSCRIPTION_RENEWED": {
        if (!tier) {
          console.error("No tier metadata found in event");
          return NextResponse.json({ 
            error: "No tier metadata on product" 
          }, { status: 400 });
        }

        const gatewayExpiry: string | undefined =
          data?.current_period_end || 
          data?.expires_at || 
          data?.period?.end;
        
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        console.log("Updating subscription:", {
          serverId,
          userUid,
          tier,
          expiresAt: expiresAt.toISOString(),
          subscriptionId
        });

        // Upsert subscription
        const { error: subError } = await supabase
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

        if (subError) {
          console.error("Subscription upsert error:", subError);
        }

        // Update server tier
        const { error: serverError } = await supabase
          .from("servers")
          .update({ 
            tier: tier as "gold" | "silver", 
            tier_expires_at: expiresAt.toISOString() 
          })
          .eq("id", serverId);

        if (serverError) {
          console.error("Server update error:", serverError);
        }

        console.log("Subscription activated/renewed successfully");
        break;
      }

      case "ON_SUBSCRIPTION_CANCELED": {
        const gatewayExpiry: string | undefined =
          data?.current_period_end || 
          data?.expires_at || 
          data?.period?.end;
        
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        console.log("Canceling subscription:", { subscriptionId, expiresAt });

        await supabase
          .from("server_subscriptions")
          .update({ 
            status: "canceled", 
            expires_at: expiresAt.toISOString() 
          })
          .eq("provider_subscription_id", subscriptionId || "");

        await supabase
          .from("servers")
          .update({ tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        console.log("Subscription canceled successfully");
        break;
      }

      default:
        console.log("Unhandled event type:", type);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ 
      error: e.message || "Webhook error" 
    }, { status: 500 });
  }
}