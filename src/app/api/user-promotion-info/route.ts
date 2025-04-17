import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { admin } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    // 1) Extract token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // 2) Verify token via Firebase Admin
    let user_id: string;
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      user_id = decoded.uid;
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 3) Fetch the user’s most recent promotion
    const { data: lastPromotion, error: lastError } = await supabase
      .from("promotions")
      .select("promoted_at")
      .eq("user_id", user_id)
      .order("promoted_at", { ascending: false })
      .limit(1)
      .single();

    if (lastError) {
      throw new Error(`Error fetching last promotion: ${lastError.message}`);
    }

    // 4) Convert that to a string or null
    const userLastPromotion = lastPromotion ? lastPromotion.promoted_at : null;

    // 5) Calculate how many promotions the user has done today
    //    This is the same daily logic you do in your "promote" route:
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const { data: dailyPromotions, error: dailyError } = await supabase
      .from("promotions")
      .select("*")
      .eq("user_id", user_id)
      .gte("promoted_at", today);

    if (dailyError) {
      throw new Error(`Error fetching daily promotions: ${dailyError.message}`);
    }

    const dailyPromotionCount = dailyPromotions ? dailyPromotions.length : 0;

    // 6) Return them in JSON
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