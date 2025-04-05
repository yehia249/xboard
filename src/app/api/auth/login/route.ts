  // app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { firebaseUid } = await req.json();

    if (!firebaseUid) {
      return NextResponse.json({ error: "Missing Firebase UID" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found in Supabase" }, { status: 404 });
    }

    return NextResponse.json({ message: "Login successful!", user });
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
