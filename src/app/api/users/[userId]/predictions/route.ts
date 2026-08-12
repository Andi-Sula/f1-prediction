import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, username, name, surname, points, predictions_count")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: predictions, error: predError } = await supabaseAdmin
      .from("predictions")
      .select("race_id, data, submitted")
      .eq("user_id", userId)
      .eq("submitted", true)
      .order("updated_at", { ascending: false })
      .limit(6);

    const raceIds = (predictions || []).map((p) => p.race_id);
    const { data: scores } = raceIds.length
      ? await supabaseAdmin
          .from("user_race_scores")
          .select("race_id, score_data")
          .eq("user_id", userId)
          .in("race_id", raceIds)
      : { data: [] };

    const scoreMap = new Map(
      (scores || []).map((s) => [s.race_id, s.score_data])
    );

    const avatar =
      ((user.name || "")[0] + (user.surname || "")[0]).toUpperCase() || "U";

    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("status", "active")
      .neq("role", "admin")
      .order("points", { ascending: false });

    const rank = (allUsers || []).findIndex((u) => u.id === userId) + 1;

    return NextResponse.json({
      user: {
        id: user.id,
        name: `${user.name} ${user.surname.charAt(0)}.`,
        avatar,
        rank: rank || null,
        points: user.points || 0,
      },
      predictions: (predictions || []).map((p) => {
        const score = scoreMap.get(p.race_id);
        return {
          raceId: p.race_id,
          predictions: p.data,
          pointsEarned: score?.finalScore ?? null,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
