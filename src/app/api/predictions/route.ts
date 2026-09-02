import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import {
  getPrediction,
  savePrediction,
  submitPrediction,
  getRace,
  getActiveRace,
  getDigitAlbTokenRaceIds,
  deployDigitAlbToken,
  applyRaiffeisenBoost,
  getUserRaceScore,
  getUserById,
  updateUser,
  DIGITALB_SEASON_TOKENS,
} from "@/lib/database";

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const raceIdParam = searchParams.get("raceId");
    const race = raceIdParam ? await getRace(raceIdParam) : await getActiveRace();
    const raceId = race?.id;
    if (!raceId) return NextResponse.json({ success: false, message: "No active race found" }, { status: 404 });

    const prediction = await getPrediction(user.id, raceId);
    const dbUser = await getUserById(user.id);
    const usedRaceIds = dbUser?.digitalbActive
      ? await getDigitAlbTokenRaceIds(user.id, race.season)
      : [];

    return NextResponse.json({
      raceId,
      raceName: race.name,
      raceStatus: race.status,
      qualifyingTime: race.qualifyingTime || null,
      bestLap: race.bestLap || null,
      digitalb: {
        active: dbUser?.digitalbActive === true,
        usesLeft: Math.max(DIGITALB_SEASON_TOKENS - usedRaceIds.length, 0),
        deployedForRace: usedRaceIds.includes(raceId),
      },
      prediction: prediction?.driverPredictions || {
        race: { p1: null, p2: null, p3: null },
        qualifying: { p1: null, p2: null, p3: null },
        conditions: { safetyCar: false, rain: false, dnfCount: 0 },
        poleTime: { minutes: "", seconds: "", milliseconds: "" },
        boosts: { raiffeisen: false, digitAlbToken: false },
        submitted: false,
      },
    });
  } catch {
    return NextResponse.json({
      race: { p1: null, p2: null, p3: null },
      qualifying: { p1: null, p2: null, p3: null },
      conditions: { safetyCar: false, rain: false, dnfCount: 0 },
      poleTime: { minutes: "", seconds: "", milliseconds: "" },
      boosts: { raiffeisen: false, digitAlbToken: false },
      submitted: false,
    });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const raceId = body.raceId || (await getActiveRace())?.id;
    if (!raceId) return NextResponse.json({ success: false, message: "No active race found" }, { status: 404 });
    const action = body.submit ? "submit" : "save";

    // Check if race is still open for predictions
    const race = await getRace(raceId);
    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    // Block predictions 5 minutes before qualifying starts
    const now = new Date();
    const deadline = race.qualifyingTime ? new Date(new Date(race.qualifyingTime).getTime() - 5 * 60 * 1000) : null;
    const qualiStarted = deadline && deadline <= now;
    const raceEnded = race.status === "completed" || race.status === "cancelled";
    if (qualiStarted || raceEnded) {
      return NextResponse.json(
        { error: "This event has already started. You can no longer set predictions for this race." },
        { status: 403 }
      );
    }

    const saveData = { ...body };
    delete saveData.raceId;
    delete saveData.submit;

    await savePrediction(user.id, raceId, saveData);

    if (action === "submit") {
      await submitPrediction(user.id, raceId);
      return NextResponse.json({ success: true, message: "Predictions submitted" });
    }

    return NextResponse.json({ success: true, message: "Predictions saved" });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to save predictions" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, raceId } = body;

    if (action === "boost/digitalb") {
      const race = await getRace(raceId);
      if (!race) {
        return NextResponse.json({ error: "Race not found" }, { status: 404 });
      }

      const dbUser = await getUserById(user.id);
      if (!dbUser?.digitalbActive) {
        return NextResponse.json(
          { error: "Verify your DigitAlb subscription in your profile first" },
          { status: 403 }
        );
      }

      const deadline = race.qualifyingTime ? new Date(new Date(race.qualifyingTime).getTime() - 5 * 60 * 1000) : null;
      const predictionsClosed = deadline && deadline <= new Date();
      if (predictionsClosed || race.status === "completed" || race.status === "cancelled") {
        return NextResponse.json({ error: "Cannot deploy token — predictions are closed" }, { status: 403 });
      }

      const usedRaceIds = await getDigitAlbTokenRaceIds(user.id, race.season);
      if (usedRaceIds.includes(raceId)) {
        return NextResponse.json({
          success: true,
          tokensRemaining: Math.max(DIGITALB_SEASON_TOKENS - usedRaceIds.length, 0),
        });
      }
      if (usedRaceIds.length >= DIGITALB_SEASON_TOKENS) {
        return NextResponse.json(
          { error: `All ${DIGITALB_SEASON_TOKENS} DigitAlb multiplier tokens have been used this season` },
          { status: 400 }
        );
      }

      await deployDigitAlbToken(user.id, raceId);
      const tokensRemaining = DIGITALB_SEASON_TOKENS - usedRaceIds.length - 1;
      await updateUser(user.id, { digitalbUsesLeft: tokensRemaining });
      return NextResponse.json({ success: true, tokensRemaining });
    }

    if (action === "boost/raiffeisen") {
      const { lastFourDigits } = body;
      if (!lastFourDigits || lastFourDigits.length !== 4) {
        return NextResponse.json({ error: "Invalid card digits" }, { status: 400 });
      }
      const result = await applyRaiffeisenBoost(user.id, raceId);
      return NextResponse.json(result);
    }

    if (action === "score") {
      const score = await getUserRaceScore(user.id, raceId);
      if (!score) {
        return NextResponse.json({ scored: false });
      }
      return NextResponse.json({ scored: true, ...score });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[Predictions PUT] Error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
