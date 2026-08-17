import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

async function autoTransitionRaces() {
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("races")
    .update({ status: "qualifying", locked: true, updated_at: now })
    .eq("status", "upcoming")
    .eq("visible", true)
    .not("qualifying_time", "is", null)
    .lte("qualifying_time", now);
}

export async function GET() {
  try {
    await autoTransitionRaces();

    const { data, error } = await supabaseAdmin
      .from("races")
      .select("id, name, date, qualifying_time, status")
      .eq("visible", true)
      .order("date", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
