import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Optional: You may not need auth here if it's just a public GET, 
// but you can add it if you only want certain users to see this data.

export async function GET() {
  try {

    //    A more robust approach is to do something like:
    //        .select("community_id, promoted_at")
    //        .order("promoted_at", { ascending: false })
    //        then group by community_id in code.

    const { data: promotions, error } = await supabase
      .from("promotions")
      .select("community_id, promoted_at")
      .order("promoted_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching promotions: ${error.message}`);
    }
    if (!promotions) {
      return NextResponse.json({ promotions: [] });
    }

    // 2) Build a map of { community_id => most recent promoted_at }
    const communityMap: { [communityId: number]: string } = {};

    for (const row of promotions) {
      if (!communityMap[row.community_id]) {
        communityMap[row.community_id] = row.promoted_at;
      }
    }

    // 3) Convert the map into an array your front end expects
    //    e.g. { promotions: [ { community_id, promoted_at }, ... ] }
    const arrayOfPromotions = Object.entries(communityMap).map(
      ([community_id_str, promoted_at]) => {
        return {
          community_id: Number(community_id_str),
          promoted_at,
        };
      }
    );

    return NextResponse.json({
      promotions: arrayOfPromotions,
    });
  } catch (err) {
    console.error("GET /api/community-promotions-info error:", err);
    return NextResponse.json(
      { error: "Error fetching community promotions info" },
      { status: 500 }
    );
  }
}