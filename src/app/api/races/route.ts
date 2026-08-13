import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

async function autoTransitionRaces() {
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("races")
    .update({ status: "qualifying", locked: true, updated_at: now })
    .eq("status", "upcoming")
    .not("qualifying_time", "is", null)
    .lte("qualifying_time", now);
}

export async function GET() {
  try {
    await autoTransitionRaces();

    const { data, error } = await supabaseAdmin
      .from("races")
      .select("id, round, name, circuit, country, date, race_time, qualifying_time, last_quali_time, status")
      .order("round", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
