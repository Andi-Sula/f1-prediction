import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

async function autoTransitionRaces() {
  const now = new Date();
  const nowISO = now.toISOString();

  // upcoming → qualifying: lock predictions 5 minutes before qualifying starts
  const lockTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("races")
    .update({ status: "qualifying", locked: true, updated_at: nowISO })
    .eq("status", "upcoming")
    .not("qualifying_time", "is", null)
    .lte("qualifying_time", lockTime);

  // qualifying → race_day: transition when race date arrives
  // Race date is stored as DATE (the day of the race). Transition at start of that day (UTC).
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  await supabaseAdmin
    .from("races")
    .update({ status: "race_day", updated_at: nowISO })
    .eq("status", "qualifying")
    .lte("date", todayStr);

  // upcoming → race_day: catch races that were never transitioned to qualifying
  // (e.g. qualifying_time was not set) but whose race date has already arrived
  await supabaseAdmin
    .from("races")
    .update({ status: "race_day", locked: true, updated_at: nowISO })
    .eq("status", "upcoming")
    .lte("date", todayStr);
}

export async function GET() {
  try {
    await autoTransitionRaces();

    const { data, error } = await supabaseAdmin
      .from("races")
      .select("id, round, name, circuit, country, date, race_time, qualifying_time, last_quali_time, status")
      .order("date", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
