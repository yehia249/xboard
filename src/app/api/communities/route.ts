// src/app/api/communities/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // 👈 admin client for writes

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const searchTerm = (searchParams.get("q") || "").trim();
    const tagsList = searchParams.get("tags");
    const selectedTags =
      tagsList?.split(",").map((t) => t.trim()).filter(Boolean) || [];
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("perPage") || "24", 10))
    );

    // ----------------------------------------
    // 1) Resolve "selected tags" into server IDs (ANY match) BEFORE pagination
    // ----------------------------------------
    let serverIdsForSelectedTags: number[] | null = null;

    if (selectedTags.length > 0) {
      // case-insensitive exact-ish match
      const orFilters = selectedTags
        .map((t) => `name.ilike.${t.trim()}`)
        .join(",");

      const { data: tagRows, error: tagErr } = await supabase
        .from("tags")
        .select("id,name")
        .or(orFilters);

      if (tagErr) throw tagErr;

      const tagIds = (tagRows || []).map((r) => r.id);
      if (tagIds.length === 0) {
        // no servers can match these tags
        return NextResponse.json({
          communities: [],
          totalCount: 0,
          page,
          perPage,
          totalPages: 0,
        });
      }

      const { data: stRows, error: stErr } = await supabase
        .from("server_tags")
        .select("server_id, tag_id")
        .in("tag_id", tagIds);

      if (stErr) throw stErr;

      const ids = Array.from(new Set((stRows || []).map((r) => r.server_id)));
      if (ids.length === 0) {
        return NextResponse.json({
          communities: [],
          totalCount: 0,
          page,
          perPage,
          totalPages: 0,
        });
      }
      serverIdsForSelectedTags = ids;
    }

    // ----------------------------------------
    // 2) If searchTerm exists, also include servers that match tag NAMES via q
    // ----------------------------------------
    let serverIdsFromSearchTags: number[] = [];
    if (searchTerm) {
      const { data: qTagRows, error: qTagErr } = await supabase
        .from("tags")
        .select("id")
        .ilike("name", `%${searchTerm}%`);
      if (qTagErr) throw qTagErr;

      const qTagIds = (qTagRows || []).map((r) => r.id);
      if (qTagIds.length) {
        const { data: qST, error: qSTErr } = await supabase
          .from("server_tags")
          .select("server_id")
          .in("tag_id", qTagIds);
        if (qSTErr) throw qSTErr;
        serverIdsFromSearchTags = Array.from(
          new Set((qST || []).map((r) => r.server_id))
        );
      }
    }

    // ----------------------------------------
    // 3) Build the base servers query with ALL filters applied BEFORE pagination
    // ----------------------------------------
    let serversQuery = supabase
      .from("servers")
      .select(
        "id, name, description, long_description, invite_link, promote_count, image_url, members, owner_id, tier, server_tags(tag_id, tags(name))",
        { count: "exact" }
      );

    if (userId) {
      serversQuery = serversQuery.eq("owner_id", userId);
    }

    // Apply "selected tags" filter across entire dataset (ANY match)
    if (serverIdsForSelectedTags) {
      serversQuery = serversQuery.in("id", serverIdsForSelectedTags);
    }

    // Apply search (name ILIKE OR id IN matches-from-tag-name)
    if (searchTerm) {
      if (serverIdsFromSearchTags.length > 0) {
        serversQuery = serversQuery.or(
          `name.ilike.%${searchTerm}%,id.in.(${serverIdsFromSearchTags.join(",")})`
        );
      } else {
        serversQuery = serversQuery.or(`name.ilike.%${searchTerm}%`);
      }
    }

    // Sort (keep your existing order)
    serversQuery = serversQuery
      .order("tier", { ascending: true })
      .order("promote_count", { ascending: false });

    // Pagination AFTER all filters are in place
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    serversQuery = serversQuery.range(from, to);

    const { data, error, count } = await serversQuery;
    if (error) throw error;

    // ----------------------------------------
    // 4) Format + attach tag names
    // ----------------------------------------
    const communities = (data || []).map((server: any) => ({
      id: server.id,
      name: server.name,
      description: server.description,
      long_description: server.long_description || "",
      invite_link: server.invite_link,
      image_url: server.image_url || null,
      members: server.members,
      owner_id: server.owner_id,
      tier: server.tier,
      promote_count: server.promote_count,
      tags: Array.isArray(server.server_tags)
        ? server.server_tags
            .map((st: any) => st?.tags?.name)
            .filter(Boolean)
        : [],
    }));

    const totalCount = count || 0;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / perPage);

    return NextResponse.json({
      communities,
      totalCount,
      page,
      perPage,
      totalPages,
    });
  } catch (error: any) {
    console.error("❌ Error fetching communities:", error);
    return NextResponse.json(
      { error: error?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Check duplicate invite_link (public client is fine for reads)
    const { data: existing, error: existingError } = await supabase
      .from("servers")
      .select("id")
      .eq("invite_link", communityURL)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json(
        { error: "This community already exists." },
        { status: 409 }
      );
    }

    // 2. Insert server with ADMIN client (bypass RLS)
    const { data: insertData, error: insertError } = await supabaseAdmin
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

    // 3. Upsert + link tags (also with admin, because server_tags has RLS)
    if (tags && Array.isArray(tags)) {
      for (const raw of tags) {
        const tagName = String(raw || "").trim();
        if (!tagName) continue;

        const { data: tagUpsert, error: tagErr } = await supabaseAdmin
          .from("tags")
          .upsert([{ name: tagName }], { onConflict: "name" })
          .select()
          .single();
        if (tagErr) throw tagErr;

        const { error: stErr } = await supabaseAdmin
          .from("server_tags")
          .insert([
            {
              server_id: serverId,
              tag_id: tagUpsert.id,
            },
          ]);
        if (stErr) throw stErr;
      }
    }

    return NextResponse.json({
      message: "Community added successfully!",
      id: serverId,
    });
  } catch (error: any) {
    console.error("❌ Error creating community:", error);
    return NextResponse.json(
      { error: error?.message || "Database error" },
      { status: 500 }
    );
  }
}
