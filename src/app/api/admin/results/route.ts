import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import {
  getAllPredictionsForRace,
  saveRaceResults,
  saveUserRaceScore,
  updateUser,
  updateRace,
} from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateEventScore } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { searchParams } = new URL(request.url);
  const raceId = searchParams.get("raceId");
  if (!raceId) return NextResponse.json({ success: false, message: "raceId required" }, { status: 400 });

  const { data, error: dbError } = await supabaseAdmin
    .from("race_results")
    .select("results")
    .eq("race_id", raceId)
    .single();

  if (dbError || !data) return NextResponse.json({ success: true, results: null });
  return NextResponse.json({ success: true, results: data.results });
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const data = await request.json();
    const raceId = data.raceId;
    const actualResults = {
      race: data.results.race,
      qualifying: data.results.qualifying,
      conditions: data.conditions,
      poleTime: data.poleTime,
    };

    await saveRaceResults(raceId, actualResults);

    const allPredictions = await getAllPredictionsForRace(raceId);

    const scores = [];
    for (const pred of allPredictions) {
      const result = calculateEventScore(pred.data, actualResults);
      await saveUserRaceScore(pred.userId, raceId, result);
      scores.push({
        userId: pred.userId,
        username: pred.username,
        score: result,
      });
    }

    // Recalculate total points for affected users from all their race scores
    const affectedUserIds = scores.map(s => s.userId);
    for (const uid of affectedUserIds) {
      const { data: allScores } = await supabaseAdmin
        .from("user_race_scores")
        .select("score_data")
        .eq("user_id", uid);
      const total = (allScores || []).reduce((sum, s) => sum + (s.score_data?.finalScore ?? 0), 0);
      await updateUser(uid, { points: total });
    }

    await updateRace(raceId, { locked: true, resultsPublished: true, status: "completed" });

    return NextResponse.json({
      success: true,
      message: `Results published. Scores calculated for ${scores.length} users.`,
      scores,
    });
  } catch (err) {
    console.error("[Admin Results] Error:", err);
    return NextResponse.json({ success: false, message: "Failed to publish results" }, { status: 500 });
  }
}
