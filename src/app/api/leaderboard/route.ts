import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username, name, surname, points, predictions_count")
      .eq("status", "active")
      .neq("role", "admin")
      .order("points", { ascending: false })
      .limit(50);

    if (error) throw error;

    const leaderboard = (data || []).map((u, i) => ({
      id: u.id,
      rank: i + 1,
      username: u.username,
      initials: ((u.name || "")[0] + (u.surname || "")[0]).toUpperCase(),
      points: u.points || 0,
      wins: (u as Record<string, unknown>).wins ?? null,
      correct: (u as Record<string, unknown>).correct_predictions ?? null,
    }));

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
