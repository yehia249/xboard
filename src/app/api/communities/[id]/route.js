import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


export async function GET(req, { params }) {
  const { id } = params;

  try {
    // Get the community data
    const { data: server, error } = await supabase
      .from("servers")
      .select("id, name,tier, description, long_description, image_url, invite_link, owner_id, promote_count")
      .eq("id", id)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Get the tags
    const { data: tagLinks, error: tagError } = await supabase
      .from("server_tags")
      .select("tags(name)")
      .eq("server_id", id);

    const tags = tagLinks?.map((entry) => entry.tags.name) || [];

    return NextResponse.json({ ...server, tags });
  } catch (err) {
    console.error("❌ Error fetching community:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    console.log("🔍 DELETE Request - Community ID:", id, "User ID:", userId);

    if (!userId) {
      console.log("❌ No userId provided");
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // First, get the server to check ownership AND tier
    const { data: server, error: fetchError } = await supabase
      .from("servers")
      .select("id, owner_id, tier")  // ✅ Added tier to the select
      .eq("id", id)
      .single();

    console.log("🔍 Server data:", server);
    console.log("🔍 Fetch error:", fetchError);

    if (fetchError || !server) {
      console.log("❌ Community not found");
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Debug the comparison
    console.log("🔍 Comparing owner_id:", server.owner_id, "with userId:", userId);
    console.log("🔍 Types - owner_id:", typeof server.owner_id, "userId:", typeof userId);
    console.log("🔍 Are they equal?", server.owner_id === userId);

    // Convert both to strings for comparison to handle any type mismatches
    if (String(server.owner_id) !== String(userId)) {
      console.log("❌ Unauthorized - owner mismatch");
      return NextResponse.json({ 
        error: "Unauthorized", 
        debug: {
          owner_id: server.owner_id,
          userId: userId,
          owner_type: typeof server.owner_id,
          user_type: typeof userId
        }
      }, { status: 403 });
    }

    // ✅ Check if community has silver or gold tier
    if (server.tier === 'silver' || server.tier === 'gold') {
      console.log("❌ Cannot delete - community has active subscription tier:", server.tier);
      return NextResponse.json({ 
        error: "This community is currently subscribed to a tier. Please wait for it to return to normal to delete.",
        tierError: true  // ✅ Flag to identify this specific error type
      }, { status: 400 });
    }

    console.log("✅ Authorization passed, proceeding with deletion");

    // Delete in the correct order to avoid foreign key constraint violations:
    
    // 1. Delete from promotions table first (if this table exists and references servers)
    const { error: promotionsDeleteError } = await supabase
      .from("promotions")
      .delete()
      .eq("community_id", id); // or whatever the foreign key column name is

    if (promotionsDeleteError) {
      console.log("❌ Error deleting promotions:", promotionsDeleteError);
      // Only throw if it's not a "table doesn't exist" or "column doesn't exist" error
      if (!promotionsDeleteError.message.includes("does not exist")) {
        throw promotionsDeleteError;
      }
    }

    // 2. Delete associated server_tags
    const { error: tagDeleteError } = await supabase
      .from("server_tags")
      .delete()
      .eq("server_id", id);

    if (tagDeleteError) {
      console.log("❌ Error deleting server tags:", tagDeleteError);
      throw tagDeleteError;
    }

    // 3. Finally delete the server
    const { error: deleteError } = await supabase
      .from("servers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.log("❌ Error deleting server:", deleteError);
      throw deleteError;
    }

    console.log("✅ Community deleted successfully");
    return NextResponse.json({ message: "Community deleted successfully!" });

  } catch (error) {
    console.error("❌ Error deleting community:", error);
    return NextResponse.json({ 
      error: "Database error", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // ✅ Accept long_description from request body
    const { description, long_description, tags } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { data: server, error } = await supabase
      .from("servers")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (server.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ✅ Update both description and long_description
    await supabase
      .from("servers")
      .update({ description, long_description })
      .eq("id", id);

    // Update tags
    await supabase.from("server_tags").delete().eq("server_id", id);

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        const tagName = tag.trim();
        if (!tagName) continue;

        const { data: tagUpsert } = await supabase
          .from("tags")
          .upsert([{ name: tagName }], { onConflict: "name" })
          .select()
          .single();

        await supabase.from("server_tags").insert([
          { server_id: id, tag_id: tagUpsert.id },
        ]);
      }
    }

    return NextResponse.json({ message: "Community updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating community:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
