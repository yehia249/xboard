import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let query = supabase
    .from("servers")
    .select("id, name, description, long_description, invite_link, image_url, members, owner_id, tier, server_tags(tag_id, tags(name))");  

    if (userId) {
      query = query.eq("owner_id", userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const communities = data.map(server => ({
      ...server,
      tags: server.server_tags.map(st => st.tags.name),
      image_url: server.image_url || null,
      long_description: server.long_description || "" // Include long_description
    }));

    return NextResponse.json(communities);
  } catch (error) {
    console.error("❌ Error fetching communities:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const {
      name,
      description,
      long_description, // ✅ NEW: long description
      communityURL,
      tags,
      imageUrl,
      members,
      userId,
    } = await req.json();

    if (!name || !description || !communityURL) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if invite_link already exists
    const { data: existing, error: existingError } = await supabase
      .from("servers")
      .select("id")
      .eq("invite_link", communityURL)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "This community already exists." }, { status: 409 }); // conflict
    }

    // 2. Proceed with insert
    const { data: insertData, error: insertError } = await supabase
      .from("servers")
      .insert([
        {
          name,
          description,
          long_description: long_description || null, // ✅ Add it here
          invite_link: communityURL,
          image_url: imageUrl,
          owner_id: userId,
          members: members || 0,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    const serverId = insertData.id;

    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        const tagName = tag.trim();
        if (!tagName) continue;

        const { data: tagUpsert } = await supabase
          .from("tags")
          .upsert([{ name: tagName }], { onConflict: "name" })
          .select()
          .single();

        await supabase.from("server_tags").insert([
          {
            server_id: serverId,
            tag_id: tagUpsert.id,
          },
        ]);
      }
    }

    return NextResponse.json({ message: "Community added successfully!", id: serverId });
  } catch (error) {
    console.error("❌ Error creating community:", error);
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 });
  }
}
