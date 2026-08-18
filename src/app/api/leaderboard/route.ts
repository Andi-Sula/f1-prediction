import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const raceId = request.nextUrl.searchParams.get("raceId");

  try {
    if (raceId) {
      // Per-race leaderboard from user_race_scores
      const { data, error } = await supabaseAdmin
        .from("user_race_scores")
        .select("user_id, score_data, users!inner(id, username, name, surname, status, role)")
        .eq("race_id", raceId)
        .eq("users.status", "active")
        .neq("users.role", "admin");

      if (error) throw error;

      const scores = (data || [])
        .map((s: any) => {
          const u = s.users;
          const sd = s.score_data || {};
          const total = sd.finalScore || sd.total || 0;
          return {
            id: u.id,
            username: u.username,
            name: `${u.name} ${(u.surname || "")[0]}.`,
            avatar: ((u.name || "")[0] + (u.surname || "")[0]).toUpperCase(),
            points: total,
            wins: 0,
            correct: sd.correct_predictions || 0,
          };
        })
        .sort((a: any, b: any) => b.points - a.points)
        .map((u: any, i: number) => ({ ...u, rank: i + 1 }));

      return NextResponse.json(scores);
    }

    // Season total leaderboard
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
      name: `${u.name} ${(u.surname || "")[0]}.`,
      points: u.points || 0,
      avatar: ((u.name || "")[0] + (u.surname || "")[0]).toUpperCase(),
      wins: 0,
      correct: u.predictions_count || 0,
    }));

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
