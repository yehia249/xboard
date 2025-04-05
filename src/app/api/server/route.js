import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Your existing client

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("servers")
      .select("*, server_tags(tag_id, tags(name))");

    if (error) throw error;

    const serversWithTags = data.map(server => ({
      ...server,
      tags: server.server_tags.map(st => st.tags.name),
      image_url: server.image_url || null,
    }));

    return NextResponse.json(serversWithTags);
  } catch (error) {
    console.error("❌ Error fetching servers:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
