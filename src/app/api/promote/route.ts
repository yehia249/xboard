import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { admin } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();
  const { community_id } = body;

  // ✅ Extract token from header
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing Firebase token" }, { status: 401 });
  }

  // ✅ Verify token using Firebase Admin
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

  // ✅ Check 6-hour cooldown
  const { data: lastPromotion } = await supabase
    .from("promotions")
    .select("promoted_at")
    .eq("user_id", user_id)
    .order("promoted_at", { ascending: false })
    .limit(1)
    .single();

  if (lastPromotion) {
    const lastTime = new Date(lastPromotion.promoted_at).getTime();
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;
    if (now - lastTime < sixHours) {
      return NextResponse.json({ error: "Wait 6 hours between promotions" }, { status: 403 });
    }
  }

  // ✅ Check daily limit (4 boosts per UTC day)
  const now = new Date();
  const utcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0
  ));

  const { data: dailyPromotions } = await supabase
    .from("promotions")
    .select("*")
    .eq("user_id", user_id)
    .gte("promoted_at", utcMidnight.toISOString());

  if ((dailyPromotions?.length || 0) >= 4) {
    return NextResponse.json({ error: "You’ve used all 4 daily boosts" }, { status: 403 });
  }

  // ✅ Check 24h cooldown per community
  const { data: lastBoost } = await supabase
    .from("promotions")
    .select("promoted_at")
    .eq("community_id", community_id)
    .order("promoted_at", { ascending: false })
    .limit(1)
    .single();

  if (lastBoost) {
    const last = new Date(lastBoost.promoted_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - last < twentyFourHours) {
      return NextResponse.json({ error: "This community was already promoted in the last 24 hours" }, { status: 403 });
    }
  }

  // ✅ Insert promotion
  const { error: insertError } = await supabase.from("promotions").insert([
    {
      user_id,
      community_id,
    },
  ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // ✅ Increment promote_count in servers table
  const { data: serverData, error: fetchError } = await supabase
    .from("servers")
    .select("promote_count")
    .eq("id", community_id)
    .single();

  if (!fetchError) {
    const currentCount = serverData?.promote_count ?? 0;

    await supabase
      .from("servers")
      .update({ promote_count: currentCount + 1 })
      .eq("id", community_id);
  }

  return NextResponse.json({ message: "Community promoted!" });
}
