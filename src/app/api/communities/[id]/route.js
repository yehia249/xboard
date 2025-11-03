import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ===================== GET =====================
export async function GET(req, { params }) {
  const { id } = params;

  try {
    // Public read is fine with the anon client
    const { data: server, error } = await supabase
      .from("servers")
      .select(
        "id, name, tier, description, long_description, image_url, invite_link, owner_id, promote_count"
      )
      .eq("id", id)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // tags (also okay to read with anon)
    const { data: tagLinks } = await supabase
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

// ===================== DELETE =====================
export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // 1) read the server with the normal client (RLS allows select)
    const { data: server, error: fetchError } = await supabase
      .from("servers")
      .select("id, owner_id, tier")
      .eq("id", id)
      .single();

    if (fetchError || !server) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 2) check ownership in JS
    if (String(server.owner_id) !== String(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3) business rule: can't delete subscribed/tiered
    if (server.tier === "silver" || server.tier === "gold") {
      return NextResponse.json(
        {
          error:
            "This community is currently subscribed to a tier. Please wait for it to return to normal to delete.",
          tierError: true,
        },
        { status: 400 }
      );
    }

    // 4) now do the actual deletes with the ADMIN client so RLS doesn't block us

    // delete promotions linked to this community
    const { error: promotionsDeleteError } = await supabaseAdmin
      .from("promotions")
      .delete()
      .eq("community_id", id);

    if (promotionsDeleteError) {
      // if table/column exists, treat as real error
      if (!promotionsDeleteError.message.includes("does not exist")) {
        throw promotionsDeleteError;
      }
    }

    // delete server_tags
    const { error: tagDeleteError } = await supabaseAdmin
      .from("server_tags")
      .delete()
      .eq("server_id", id);

    if (tagDeleteError) {
      throw tagDeleteError;
    }

    // finally delete server
    const { error: deleteError } = await supabaseAdmin
      .from("servers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: "Community deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting community:", error);
    return NextResponse.json(
      {
        error: "Database error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ===================== PUT (update) =====================
export async function PUT(req, { params }) {
  const { id } = params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const { description, long_description, tags } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // 1) read server to confirm ownership
    const { data: server, error } = await supabase
      .from("servers")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (String(server.owner_id) !== String(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2) update server with ADMIN client (bypass RLS)
    await supabaseAdmin
      .from("servers")
      .update({ description, long_description })
      .eq("id", id);

    // 3) reset tags
    await supabaseAdmin.from("server_tags").delete().eq("server_id", id);

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        const tagName = tag.trim();
        if (!tagName) continue;

        // upsert tag (admin so RLS doesn't block insert)
        const { data: tagUpsert, error: tagUpsertError } = await supabaseAdmin
          .from("tags")
          .upsert([{ name: tagName }], { onConflict: "name" })
          .select()
          .single();

        if (tagUpsertError) {
          throw tagUpsertError;
        }

        // link tag to server
        const { error: linkError } = await supabaseAdmin
          .from("server_tags")
          .insert([{ server_id: id, tag_id: tagUpsert.id }]);

        if (linkError) {
          throw linkError;
        }
      }
    }

    return NextResponse.json({ message: "Community updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating community:", error);
    return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
  }
}
