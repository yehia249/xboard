import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { admin } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();
  const { community_id } = body;

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing Firebase token" }, { status: 401 });
  }

  let user_id: string;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    user_id = decoded.uid;
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!user_id || !community_id) {
    return NextResponse.json({ error: "Missing user or community ID" }, { status: 400 });
  }

  // ✅ Personal cooldown (UNLIMITED boosts, but min 1 hour between any two boosts by the same user)
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const { data: lastPromotion, error: lastUserErr } = await supabase
    .from("promotions")
    .select("promoted_at")
    .eq("user_id", user_id)
    .order("promoted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastUserErr) {
    // Not fatal — but you can log if needed
    // console.error("Error fetching last user promotion:", lastUserErr);
  }

  if (lastPromotion?.promoted_at) {
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
        { status: 429 } // rate limited
      );
    }
  }

  // ❌ REMOVED: Daily limit (4 boosts max)
  // -- Entire block deleted to allow unlimited daily boosts --

  // ✅ Get tier of community (this controls the COMMUNITY-SIDE cooldown)
  const { data: serverTier, error: tierErr } = await supabase
    .from("servers")
    .select("tier")
    .eq("id", community_id)
    .single();

  if (tierErr || !serverTier) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // ✅ Determine community-level cooldown (kept as-is; change these if you want 4/2/1 hrs)
  // Current behavior you had: normal 24h, silver 12h, gold 6h
  // If you want 4/2/1 instead, change the mapping below accordingly.
  let cooldownMs = 24 * 60 * 60 * 1000; // normal
  if (serverTier.tier === "silver") cooldownMs = 12 * 60 * 60 * 1000;
  if (serverTier.tier === "gold") cooldownMs = 6 * 60 * 60 * 1000;

  // ✅ Check last promotion time of THIS community (site-wide anti-spam)
  const { data: lastBoost, error: lastCommErr } = await supabase
    .from("promotions")
    .select("promoted_at")
    .eq("community_id", community_id)
    .order("promoted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastCommErr) {
    // Not fatal — but log if you want
    // console.error("Error fetching community last boost:", lastCommErr);
  }

  if (lastBoost?.promoted_at) {
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
      // promoted_at should default to now() in DB; include if your schema doesn't:
      // promoted_at: new Date().toISOString(),
    },
  ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }


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
}
