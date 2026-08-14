import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Count exact correct predictions from a score_data breakdown
// Qualifying: p1=10 exact, p2=8 exact, p3=6 exact
// Race: p1=25 exact, p2=18 exact, p3=15 exact
// Conditions: rain=5, safetyCar=5, dnf=10
// Pole time: minutesSeconds > 0 counts as correct
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countCorrectPredictions(scoreData: any): number {
  if (!scoreData?.breakdown) return 0;
  const b = scoreData.breakdown;
  let count = 0;

  // Qualifying exact positions
  if (b.qualifying?.p1 === 10) count++;
  if (b.qualifying?.p2 === 8) count++;
  if (b.qualifying?.p3 === 6) count++;

  // Race exact positions
  if (b.race?.p1 === 25) count++;
  if (b.race?.p2 === 18) count++;
  if (b.race?.p3 === 15) count++;

  // Conditions
  if (b.conditions?.rain === 5) count++;
  if (b.conditions?.safetyCar === 5) count++;
  if (b.conditions?.dnf === 10) count++;

  // Pole time (at least minutes + seconds correct)
  if (b.poleTime?.minutesSeconds > 0) count++;

  return count;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get("raceId");

    if (raceId) {
      // Per-race leaderboard from user_race_scores
      const { data: scores, error } = await supabaseAdmin
        .from("user_race_scores")
        .select("user_id, score_data, users(username, name, surname, role, status)")
        .eq("race_id", raceId);

      if (error) throw error;

      const filtered = (scores || []).filter((s: Record<string, unknown>) => {
        const u = s.users as Record<string, unknown> | null;
        return u && u.status === "active" && u.role !== "admin";
      });

      const sorted = filtered.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aScore = (a.score_data as Record<string, unknown>)?.finalScore as number ?? 0;
        const bScore = (b.score_data as Record<string, unknown>)?.finalScore as number ?? 0;
        return bScore - aScore;
      });

      const leaderboard = sorted.map((s: Record<string, unknown>, i: number) => {
        const u = s.users as Record<string, string> | null;
        return {
          id: s.user_id,
          rank: i + 1,
          username: u?.username || "Unknown",
          initials: ((u?.name || "")[0] + (u?.surname || "")[0]).toUpperCase(),
          points: (s.score_data as Record<string, unknown>)?.finalScore ?? 0,
          wins: null,
          correct: countCorrectPredictions(s.score_data),
        };
      });

      return NextResponse.json(leaderboard);
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

    // Count per-race wins and correct predictions for each user
    const { data: allScores } = await supabaseAdmin
      .from("user_race_scores")
      .select("user_id, race_id, score_data");

    // Group scores by race to find winner of each race
    const raceScores: Record<string, { userId: string; score: number }[]> = {};
    const correctCounts: Record<string, number> = {};
    for (const s of allScores || []) {
      const rId = s.race_id as string;
      const uid = s.user_id as string;
      const score = (s.score_data as Record<string, unknown>)?.finalScore as number ?? 0;
      if (!raceScores[rId]) raceScores[rId] = [];
      raceScores[rId].push({ userId: uid, score });

      // Accumulate correct predictions across all races
      correctCounts[uid] = (correctCounts[uid] || 0) + countCorrectPredictions(s.score_data);
    }

    // Count how many races each user won
    const winCounts: Record<string, number> = {};
    for (const rId of Object.keys(raceScores)) {
      const sorted = raceScores[rId].sort((a, b) => b.score - a.score);
      if (sorted.length > 0 && sorted[0].score > 0) {
        const winnerId = sorted[0].userId;
        winCounts[winnerId] = (winCounts[winnerId] || 0) + 1;
      }
    }

    const leaderboard = (data || []).map((u, i) => ({
      id: u.id,
      rank: i + 1,
      username: u.username,
      initials: ((u.name || "")[0] + (u.surname || "")[0]).toUpperCase(),
      points: u.points || 0,
      wins: winCounts[u.id] || 0,
      correct: correctCounts[u.id] || 0,
    }));

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// GET round winners for each completed race
export async function POST(request: NextRequest) {
  try {
    const { raceIds } = await request.json() as { raceIds: string[] };
    if (!raceIds || raceIds.length === 0) {
      return NextResponse.json({});
    }

    const { data: scores, error } = await supabaseAdmin
      .from("user_race_scores")
      .select("user_id, race_id, score_data, users(username, status, role)")
      .in("race_id", raceIds);

    if (error) throw error;

    // Group by race, find top scorer per race
    const raceWinners: Record<string, { username: string; points: number }> = {};
    const grouped: Record<string, { userId: string; username: string; score: number }[]> = {};

    for (const s of scores || []) {
      const u = s.users as unknown as Record<string, unknown> | null;
      if (!u || u.status !== "active" || u.role === "admin") continue;
      const rId = s.race_id as string;
      const score = (s.score_data as Record<string, unknown>)?.finalScore as number ?? 0;
      if (!grouped[rId]) grouped[rId] = [];
      grouped[rId].push({ userId: s.user_id as string, username: (u.username as string) || "Unknown", score });
    }

    for (const rId of Object.keys(grouped)) {
      const sorted = grouped[rId].sort((a, b) => b.score - a.score);
      if (sorted.length > 0 && sorted[0].score > 0) {
        raceWinners[rId] = { username: sorted[0].username, points: sorted[0].score };
      }
    }

    return NextResponse.json(raceWinners);
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
