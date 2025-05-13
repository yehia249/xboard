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

    await supabase.from("servers").delete().eq("id", id);

    return NextResponse.json({ message: "Community deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting community:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
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
