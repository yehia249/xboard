// src/app/api/communities/search/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get("perPage") || 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("servers")
    .select("id,name,description,image_url,tier", { count: "exact" })
    .eq("tier", "normal");

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    communities: data ?? [],
    total: count ?? 0,
    page,
    perPage,
  });
}
