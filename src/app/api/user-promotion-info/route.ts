// src/app/api/user-promotion-info/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 1) Extract token from the Authorization header
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // 2) Verify token via Firebase Admin
    let user_id: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      user_id = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 3) Fetch last promotion timestamp by this user (may be null)
    const { data: lastPromotion, error: lastErr } = await supabase
      .from("promotions")
      .select("promoted_at")
      .eq("user_id", user_id)
      .order("promoted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      throw new Error(`Error fetching last promotion: ${lastErr.message}`);
    }

    const userLastPromotion = lastPromotion?.promoted_at ?? null;

    // 4) Count today's promotions by this user (ISO date boundary)
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const { data: dailyPromotions, error: dailyErr } = await supabase
      .from("promotions")
      .select("id")
      .eq("user_id", user_id)
      .gte("promoted_at", today);

    if (dailyErr) {
      throw new Error(`Error fetching daily promotions: ${dailyErr.message}`);
    }

    const dailyPromotionCount = dailyPromotions?.length ?? 0;

    // 5) Return JSON
    return NextResponse.json({
      userLastPromotion,
      dailyPromotionCount,
    });
  } catch (err) {
    console.error("GET /api/user-promotion-info error:", err);
    return NextResponse.json(
      { error: "Error fetching user promotion info" },
      { status: 500 }
    );
  }
}
