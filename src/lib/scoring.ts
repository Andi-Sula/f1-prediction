/**
 * F1 Predictor — Official Scoring Engine
 * Max base event score: 129 points
 */

interface PodiumPrediction {
  p1: string | null;
  p2: string | null;
  p3: string | null;
}

interface PoleTimePrediction {
  minutes: string;
  seconds: string;
  milliseconds: string;
}

interface ConditionsPrediction {
  rain: boolean;
  safetyCar: boolean;
  dnfCount: number;
}

interface FullPrediction {
  qualifying: PodiumPrediction;
  race: PodiumPrediction;
  poleTime: PoleTimePrediction;
  conditions: ConditionsPrediction;
  boosts?: { raiffeisen?: boolean; digitAlbToken?: boolean };
}

interface ActualResults {
  qualifying: PodiumPrediction;
  race: PodiumPrediction;
  poleTime: PoleTimePrediction;
  conditions: ConditionsPrediction;
}

// ─── A. Qualifying Top 3 (max 24 pts) ───
export function scoreQualifying(prediction: PodiumPrediction, actual: PodiumPrediction) {
  const predTop3 = [prediction.p1, prediction.p2, prediction.p3];
  const actTop3 = [actual.p1, actual.p2, actual.p3];
  const breakdown = { p1: 0, p2: 0, p3: 0 };

  if (predTop3[0] && predTop3[0] === actTop3[0]) {
    breakdown.p1 = 10;
  } else if (predTop3[0] && (predTop3[0] === actTop3[1] || predTop3[0] === actTop3[2])) {
    breakdown.p1 = 5;
  }

  if (predTop3[1] && predTop3[1] === actTop3[1]) {
    breakdown.p2 = 8;
  } else if (predTop3[1] && (predTop3[1] === actTop3[0] || predTop3[1] === actTop3[2])) {
    breakdown.p2 = 4;
  }

  if (predTop3[2] && predTop3[2] === actTop3[2]) {
    breakdown.p3 = 6;
  } else if (predTop3[2] && (predTop3[2] === actTop3[0] || predTop3[2] === actTop3[1])) {
    breakdown.p3 = 3;
  }

  const points = breakdown.p1 + breakdown.p2 + breakdown.p3;
  return { points, breakdown, max: 24 };
}

// ─── B. Pole Position Time (max 27 pts) ───
export function scorePoleTime(prediction: PoleTimePrediction, actual: PoleTimePrediction) {
  const breakdown = { minutesSeconds: 0, tenths: 0, hundredths: 0, thousandths: 0 };

  if (!prediction.minutes || !prediction.seconds || !actual.minutes || !actual.seconds) {
    return { points: 0, breakdown, max: 27 };
  }

  const predMin = String(prediction.minutes).padStart(2, "0");
  const predSec = String(prediction.seconds).padStart(2, "0");
  const predMs = String(prediction.milliseconds || "000").padStart(3, "0");

  const actMin = String(actual.minutes).padStart(2, "0");
  const actSec = String(actual.seconds).padStart(2, "0");
  const actMs = String(actual.milliseconds || "000").padStart(3, "0");

  if (predMin !== actMin || predSec !== actSec) {
    return { points: 0, breakdown, max: 27 };
  }

  let points = 2;
  breakdown.minutesSeconds = 2;

  if (predMs[0] === actMs[0]) {
    breakdown.tenths = 5;
    points += 5;

    if (predMs[1] === actMs[1]) {
      breakdown.hundredths = 5;
      points += 5;

      if (predMs[2] === actMs[2]) {
        breakdown.thousandths = 15;
        points += 15;
      }
    }
  }

  return { points, breakdown, max: 27 };
}

// ─── C. Race Podium Top 3 (max 58 pts) ───
export function scoreRace(prediction: PodiumPrediction, actual: PodiumPrediction) {
  const predTop3 = [prediction.p1, prediction.p2, prediction.p3];
  const actTop3 = [actual.p1, actual.p2, actual.p3];
  const breakdown = { p1: 0, p2: 0, p3: 0 };

  if (predTop3[0] && predTop3[0] === actTop3[0]) {
    breakdown.p1 = 25;
  } else if (predTop3[0] && (predTop3[0] === actTop3[1] || predTop3[0] === actTop3[2])) {
    breakdown.p1 = 10;
  }

  if (predTop3[1] && predTop3[1] === actTop3[1]) {
    breakdown.p2 = 18;
  } else if (predTop3[1] && (predTop3[1] === actTop3[0] || predTop3[1] === actTop3[2])) {
    breakdown.p2 = 8;
  }

  if (predTop3[2] && predTop3[2] === actTop3[2]) {
    breakdown.p3 = 15;
  } else if (predTop3[2] && (predTop3[2] === actTop3[0] || predTop3[2] === actTop3[1])) {
    breakdown.p3 = 6;
  }

  const points = breakdown.p1 + breakdown.p2 + breakdown.p3;
  return { points, breakdown, max: 58 };
}

// ─── D. Race Conditions & Props (max 20 pts) ───
export function scoreConditions(prediction: ConditionsPrediction, actual: ConditionsPrediction) {
  const breakdown = { rain: 0, safetyCar: 0, dnf: 0 };

  if (prediction.rain === actual.rain) breakdown.rain = 5;
  if (prediction.safetyCar === actual.safetyCar) breakdown.safetyCar = 5;
  if (Number(prediction.dnfCount) === Number(actual.dnfCount)) breakdown.dnf = 10;

  const points = breakdown.rain + breakdown.safetyCar + breakdown.dnf;
  return { points, breakdown, max: 20 };
}

// ─── Full Event Score ───
export function calculateEventScore(prediction: FullPrediction, actualResults: ActualResults) {
  const qualifying = scoreQualifying(prediction.qualifying, actualResults.qualifying);
  const poleTime = scorePoleTime(prediction.poleTime, actualResults.poleTime);
  const race = scoreRace(prediction.race, actualResults.race);
  const conditions = scoreConditions(prediction.conditions, actualResults.conditions);

  const baseScore = qualifying.points + poleTime.points + race.points + conditions.points;
  const digitAlbMultiplier = prediction.boosts?.digitAlbToken ? 2 : 1;
  const multipliedScore = baseScore * digitAlbMultiplier;
  const raiffeisenBoost = prediction.boosts?.raiffeisen ? 15 : 0;
  const finalScore = multipliedScore + raiffeisenBoost;

  return {
    qualifying,
    poleTime,
    race,
    conditions,
    baseScore,
    maxBaseScore: 129,
    digitAlbMultiplier,
    multipliedScore,
    raiffeisenBoost,
    finalScore,
    breakdown: {
      qualifying: qualifying.breakdown,
      poleTime: poleTime.breakdown,
      race: race.breakdown,
      conditions: conditions.breakdown,
    },
  };
}
