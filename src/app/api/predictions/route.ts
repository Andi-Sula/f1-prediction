import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import {
  getPrediction,
  savePrediction,
  submitPrediction,
  getRace,
  getActiveRace,
  getDigitAlbTokensUsed,
  deployDigitAlbToken,
  applyRaiffeisenBoost,
  getUserRaceScore,
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
    return NextResponse.json({
      raceId,
      raceName: race.name,
      raceStatus: race.status,
      qualifyingTime: race.qualifyingTime || null,
      lastQualiTime: race.lastQualiTime || null,
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
    if (race.status !== "upcoming") {
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
      const tokensUsed = await getDigitAlbTokensUsed(user.id);
      if (tokensUsed >= 3) {
        return NextResponse.json({ error: "All 3 DigitAlb multiplier tokens have been used this season" }, { status: 400 });
      }
      const race = await getRace(raceId);
      if (race && race.locked) {
        return NextResponse.json({ error: "Cannot deploy token after qualifying has started" }, { status: 403 });
      }
      await deployDigitAlbToken(user.id, raceId);
      return NextResponse.json({ success: true, tokensRemaining: 3 - tokensUsed - 1 });
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
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
