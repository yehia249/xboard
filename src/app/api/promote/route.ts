// src/app/api/promote/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { community_id } = body;

    // Auth header
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Firebase token" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json({ error: "Missing Firebase token" }, { status: 401 });
    }

    // Verify token
    let user_id: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      user_id = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user_id || !community_id) {
      return NextResponse.json({ error: "Missing user or community ID" }, { status: 400 });
    }

    // ✅ Personal cooldown: UNLIMITED boosts, but 1 hour between any two boosts by the same user
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const { data: lastPromotion, error: lastUserErr } = await supabase
      .from("promotions")
      .select("promoted_at")
      .eq("user_id", user_id)
      .order("promoted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastUserErr && lastPromotion?.promoted_at) {
      const lastTime = new Date(lastPromotion.promoted_at).getTime();
      const nowTs = Date.now();
      const elapsed = nowTs - lastTime;

      if (elapsed < ONE_HOUR_MS) {
        const remainingSec = Math.ceil((ONE_HOUR_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: "Cooldown active. Please wait before boosting again.",
            secondsRemaining: remainingSec,
            nextEligibleAt: new Date(nowTs + (ONE_HOUR_MS - elapsed)).toISOString(),
            reason: "user_personal_cooldown",
          },
          { status: 429 }
        );
      }
    }

    // ✅ Community tier → community-level cooldown
    const { data: serverTier, error: tierErr } = await supabase
      .from("servers")
      .select("tier")
      .eq("id", community_id)
      .single();

    if (tierErr || !serverTier) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // normal: 4h, silver: 2h, gold: 1h
    let cooldownMs = 4 * 60 * 60 * 1000; // normal
    if (serverTier.tier === "silver") cooldownMs = 2 * 60 * 60 * 1000;
    if (serverTier.tier === "gold") cooldownMs = 1 * 60 * 60 * 1000;

    // ✅ Community cooldown check (site-wide)
    const { data: lastBoost, error: lastCommErr } = await supabase
      .from("promotions")
      .select("promoted_at")
      .eq("community_id", community_id)
      .order("promoted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastCommErr && lastBoost?.promoted_at) {
      const last = new Date(lastBoost.promoted_at).getTime();
      const nowTs = Date.now();
      const elapsed = nowTs - last;

      if (elapsed < cooldownMs) {
        const remainingMs = cooldownMs - elapsed;
        const remainingSec = Math.ceil(remainingMs / 1000);
        return NextResponse.json(
          {
            error: "This community was already promoted recently.",
            secondsRemaining: remainingSec,
            nextEligibleAt: new Date(nowTs + remainingMs).toISOString(),
            reason: "community_cooldown",
          },
          { status: 429 }
        );
      }
    }

    // ✅ Insert promotion
    const { error: insertError } = await supabase.from("promotions").insert([
      {
        user_id,
        community_id,
        // If your DB doesn't default promoted_at to now(), uncomment the next line:
        // promoted_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment promote_count (non-critical if this fails)
    const { data: serverData } = await supabase
      .from("servers")
      .select("promote_count")
      .eq("id", community_id)
      .single();

    const currentCount = serverData?.promote_count ?? 0;
    await supabase
      .from("servers")
      .update({ promote_count: currentCount + 1 })
      .eq("id", community_id);

    return NextResponse.json({ message: "Community promoted!" });
  } catch (err) {
    console.error("POST /api/promote error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
