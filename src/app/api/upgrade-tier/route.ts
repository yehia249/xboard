// /app/api/upgrade-tier/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { community_id, new_tier } = await req.json();

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing Firebase token" }, { status: 401 });
  }

  try {
    await adminAuth.verifyIdToken(token);
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!["silver", "gold"].includes(new_tier)) {
    return NextResponse.json({ error: "Invalid tier selected" }, { status: 400 });
  }

  try {
    // Fetch current server
    const { data: server, error: fetchError } = await supabase
      .from("servers")
      .select("id, tier")
      .eq("id", community_id)
      .single();

    if (fetchError || !server) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Prevent downgrade
    const tierOrder: { [key: string]: number } = { normal: 0, silver: 1, gold: 2 };
    const currentTier = server.tier || "normal";
    if (tierOrder[new_tier] <= tierOrder[currentTier]) {
      return NextResponse.json(
        { error: "You can’t downgrade or re-purchase the same tier" },
        { status: 400 }
      );
    }

    // Upgrade the tier
    const { error: updateError } = await supabase
      .from("servers")
      .update({ tier: new_tier })
      .eq("id", community_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
    }

    return NextResponse.json({ message: `Tier successfully upgraded to ${new_tier}` });
  } catch (err) {
    console.error("Upgrade Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
