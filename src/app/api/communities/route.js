import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const searchTerm = searchParams.get("q") || "";
    const tagsList = searchParams.get("tags");
    const tags = tagsList?.split(",").filter(tag => tag.trim() !== "") || [];
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "24");
    
    // Calculate pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // First, if we have a searchTerm and need to search tags, we'll need to get server IDs with matching tags
    let serverIdsWithMatchingTags = [];
    if (searchTerm) {
      const { data: tagMatches } = await supabase
        .from("tags")
        .select("id")
        .ilike("name", `%${searchTerm}%`);
      
      if (tagMatches && tagMatches.length > 0) {
        const tagIds = tagMatches.map(tag => tag.id);
        
        const { data: serverTagMatches } = await supabase
          .from("server_tags")
          .select("server_id")
          .in("tag_id", tagIds);
        
        if (serverTagMatches) {
          serverIdsWithMatchingTags = serverTagMatches.map(st => st.server_id);
        }
      }
    }

    // Start building the base query
    let query = supabase
      .from("servers")
      .select("id, name, description, long_description, invite_link, promote_count, image_url, members, owner_id, tier, server_tags(tag_id, tags(name))", 
        { count: "exact" });

    // Apply owner filter if userId is provided
    if (userId) {
      query = query.eq("owner_id", userId);
    }

    // Apply search filter if searchTerm is provided
    if (searchTerm) {
      if (serverIdsWithMatchingTags.length > 0) {
        // Search in name OR matching server IDs from tags
        query = query.or(`name.ilike.%${searchTerm}%,id.in.(${serverIdsWithMatchingTags.join(',')})`);
      } else {
        // Search in name only — without the broken comma
        query = query.or(`name.ilike.%${searchTerm}%`);
      }
    }
    

    // If specific tags are selected for filtering
    if (tags.length > 0) {
      // We'll handle tag filtering in-memory after fetching data
    }

    // Add sorting by tier (gold first, then silver, then normal)
    // Then within each tier, sort by promote_count (highest first)
    query = query.order("tier", { ascending: true }).order("promote_count", { ascending: false });

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) throw error;

    // Process the results to extract tags and format the data
    let communities = data.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description,
      long_description: server.long_description || "",
      invite_link: server.invite_link,
      image_url: server.image_url || null,
      members: server.members,
      owner_id: server.owner_id,
      tier: server.tier,
      tags: server.server_tags.map(st => st.tags.name)
    }));

    // Apply tag filtering if needed (after getting the initial data)
    if (tags.length > 0) {
      communities = communities.filter(community => 
        tags.some(tag => community.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
      );
    }

    // Total count after all filters
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      communities,
      totalCount,
      page,
      perPage,
      totalPages
    });
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
      long_description,
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
          long_description: long_description || null,
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