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
    
    // LOG THE ENTIRE WEBHOOK FOR DEBUGGING
    console.log("🔔 PayNow Webhook received:", JSON.stringify(evt, null, 2));
    
    const type: string = evt?.event_type;
    const data: any = evt?.body || evt?.data || {};
    const now = new Date();

    // ---- reference (support multiple shapes) ----
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
      console.warn("⚠️ No reference found in webhook. Payload:", JSON.stringify(evt, null, 2));
      return NextResponse.json({ ok: true, note: "No reference; nothing to update." }, { status: 200 });
    }

    // Parse "srv=123|uid=abc"
    const params = new URLSearchParams(reference.replaceAll("|", "&"));
    const serverId = Number(params.get("srv") || "");
    const userUid = params.get("uid") || "";
    
    console.log("📋 Parsed reference - serverId:", serverId, "userUid:", userUid);
    
    if (!serverId || !userUid) {
      console.error("❌ Missing serverId/userUid in reference:", reference);
      return NextResponse.json({ error: "Missing serverId/userUid in reference" }, { status: 400 });
    }

    // ---- tier lookup (EXPANDED to check more locations) ----
    let tierRaw: string = "";
    
    // Helper function to deeply search for tier in nested objects
    function findTierInObject(obj: any, path: string = ""): string {
      if (!obj || typeof obj !== "object") return "";
      
      // Check if current object has tier
      if (obj.tier) {
        console.log(`✅ Found tier at ${path}.tier:`, obj.tier);
        return obj.tier;
      }
      if (obj.metadata?.tier) {
        console.log(`✅ Found tier at ${path}.metadata.tier:`, obj.metadata.tier);
        return obj.metadata.tier;
      }
      
      // Recursively check arrays
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const result = findTierInObject(obj[i], `${path}[${i}]`);
          if (result) return result;
        }
      }
      
      // Recursively check common nested locations
      const keysToCheck = ['lines', 'order', 'checkout', 'product', 'data', 'body'];
      for (const key of keysToCheck) {
        if (obj[key]) {
          const result = findTierInObject(obj[key], path ? `${path}.${key}` : key);
          if (result) return result;
        }
      }
      
      return "";
    }
    
    // Try structured locations first
    const possibleTierLocations = [
      { path: "data.product.metadata.tier", value: data?.product?.metadata?.tier },
      { path: "data.variables.tier", value: data?.variables?.tier },
      { path: "data.plan.metadata.tier", value: data?.plan?.metadata?.tier },
      { path: "data.order.lines[0].metadata.tier", value: data?.order?.lines?.[0]?.metadata?.tier },
      { path: "data.lines[0].metadata.tier", value: data?.lines?.[0]?.metadata?.tier },
      { path: "data.checkout.lines[0].metadata.tier", value: data?.checkout?.lines?.[0]?.metadata?.tier },
      { path: "data.metadata.tier", value: data?.metadata?.tier },
      { path: "evt.metadata.tier", value: evt?.metadata?.tier },
      { path: "evt.lines[0].metadata.tier", value: evt?.lines?.[0]?.metadata?.tier },
      { path: "evt.body.lines[0].metadata.tier", value: evt?.body?.lines?.[0]?.metadata?.tier },
    ];
    
    console.log("🔍 Searching for tier in structured locations...");
    for (const location of possibleTierLocations) {
      if (location.value) {
        tierRaw = location.value;
        console.log(`✅ Found tier at ${location.path}:`, tierRaw);
        break;
      }
    }
    
    // If not found, do deep search
    if (!tierRaw) {
      console.log("🔍 Tier not found in structured locations, performing deep search...");
      tierRaw = findTierInObject(evt, "evt");
    }
    
    // Log if tier not found
    if (!tierRaw) {
      console.error("❌ Tier not found anywhere in webhook payload");
      console.log("Full webhook payload:", JSON.stringify(evt, null, 2));
    }
    
    const tier = tierRaw === "gold" || tierRaw === "silver" ? tierRaw : null;

    const subscriptionId: string | undefined =
      data?.subscription_id || data?.id || data?.subscription?.id;

    console.log("🎯 Processing event:", type, "| Tier:", tier, "| ServerId:", serverId);

    switch (type) {
      case "ON_ORDER_COMPLETED": {
        if (!tier) {
          console.error("❌ Order completed but no tier found. Data:", JSON.stringify(data, null, 2));
          return NextResponse.json({ ok: true, note: "Order completed without tier metadata." }, { status: 200 });
        }
        const expiresAt = plusOneMonth(now);

        console.log("💰 Processing one-time order - tier:", tier, "expires:", expiresAt);

        // record (best-effort)
        try {
          const { error: upsertError } = await supabase.from("server_subscriptions").upsert(
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
          
          if (upsertError) {
            console.error("❌ Upsert subscription failed:", upsertError);
          } else {
            console.log("✅ Subscription record created");
          }
        } catch (e) {
          console.error("❌ Upsert one-time failed:", e);
        }

        const { error: serverUpdateError } = await supabase
          .from("servers")
          .update({ tier: tier as "gold" | "silver", tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        if (serverUpdateError) {
          console.error("❌ Failed to update server tier:", serverUpdateError);
        } else {
          console.log("✅ Server tier updated successfully to:", tier);
        }

        break;
      }

      case "ON_SUBSCRIPTION_ACTIVATED":
      case "ON_SUBSCRIPTION_RENEWED": {
        if (!tier) {
          console.error("❌ Subscription event without tier. Data:", JSON.stringify(data, null, 2));
          return NextResponse.json({ error: "No tier metadata on product" }, { status: 400 });
        }

        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        console.log("🔄 Processing subscription event - tier:", tier, "expires:", expiresAt);

        const { error: upsertError } = await supabase.from("server_subscriptions").upsert(
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

        if (upsertError) {
          console.error("❌ Failed to upsert subscription:", upsertError);
        } else {
          console.log("✅ Subscription upserted successfully");
        }

        const { error: serverUpdateError } = await supabase
          .from("servers")
          .update({ tier: tier as "gold" | "silver", tier_expires_at: expiresAt.toISOString() })
          .eq("id", serverId);

        if (serverUpdateError) {
          console.error("❌ Failed to update server:", serverUpdateError);
        } else {
          console.log("✅ Server updated successfully");
        }

        break;
      }

      case "ON_SUBSCRIPTION_CANCELED": {
        const gatewayExpiry: string | undefined =
          data?.current_period_end || data?.expires_at || data?.period?.end;
        const expiresAt = gatewayExpiry ? new Date(gatewayExpiry) : plusOneMonth(now);

        console.log("🚫 Processing cancellation - expires:", expiresAt);

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
        console.log("ℹ️ Unhandled event type:", type);
        break;
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("❌ Webhook error:", e);
    return NextResponse.json({ error: e?.message || "Webhook error" }, { status: 500 });
  }
}