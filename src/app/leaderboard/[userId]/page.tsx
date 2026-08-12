export const dynamic = "force-dynamic";

import {
  Trophy,
  Medal,
  Star,
  ArrowLeft,
  FlagTriangleRight,
  Timer,
  CloudRain,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";

interface Prediction {
  raceId: string;
  raceName: string;
  raceDate: string;
  predictions: {
    race: { p1: string; p2: string; p3: string };
    qualifying: { p1: string; p2: string; p3: string };
    conditions: { safetyCar: boolean; rain: boolean; dnfCount: number };
    poleTime: { minutes: string; seconds: string; milliseconds: string };
  } | null;
  pointsEarned: number;
  participated: boolean;
}

interface UserData {
  user: { id: string; name: string; avatar: string; rank: number; points: number };
  predictions: Prediction[];
}

async function getDriverNames(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("drivers")
      .select("code, name")
      .eq("active", true);
    if (error) throw error;
    return Object.fromEntries((data || []).map(d => [d.code, d.name]));
  } catch {
    return {};
  }
}

async function getUserPredictions(userId: string): Promise<UserData | null> {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, username, name, surname, points, predictions_count")
      .eq("id", userId)
      .single();

    if (userError || !user) return null;

    // Get all completed/cancelled races (descending by date)
    const { data: allRaces } = await supabaseAdmin
      .from("races")
      .select("id, name, race_time, qualifying_time, date")
      .in("status", ["completed", "cancelled"])
      .order("date", { ascending: false });

    const { data: predictions } = await supabaseAdmin
      .from("predictions")
      .select("race_id, driver_predictions")
      .eq("user_id", userId);

    const predMap = new Map((predictions || []).map((p) => [p.race_id, p.driver_predictions]));

    // Fetch all scores for this user (not just for races with predictions)
    const { data: scores } = await supabaseAdmin
      .from("user_race_scores")
      .select("race_id, score_data")
      .eq("user_id", userId);

    const scoreMap = new Map((scores || []).map((s) => [s.race_id, s.score_data]));
    const avatar = ((user.name || "")[0] + (user.surname || "")[0]).toUpperCase() || "U";

    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("status", "active")
      .neq("role", "admin")
      .order("points", { ascending: false });

    const rank = (allUsers || []).findIndex((u) => u.id === userId) + 1;

    return {
      user: {
        id: user.id,
        name: `${user.name} ${user.surname.charAt(0)}.`,
        avatar,
        rank: rank || 0,
        points: user.points || 0,
      },
      predictions: (allRaces || []).map((race) => {
        const pred = predMap.get(race.id);
        const score = scoreMap.get(race.id);
        const dt = race.race_time || race.qualifying_time || race.date;
        const formattedDate = dt ? new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
        return {
          raceId: race.id,
          raceName: race.name,
          raceDate: formattedDate,
          predictions: pred || null,
          pointsEarned: score?.finalScore ?? 0,
          participated: !!(pred || score),
        };
      }),
    };
  } catch {
    return null;
  }
}

export default async function UserPredictionsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [data, driverNames] = await Promise.all([getUserPredictions(userId), getDriverNames()]);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-[calc(100vh-4rem)] flex items-center justify-center pb-24 md:pb-10">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold">User not found</p>
          <Link href="/leaderboard" className="text-[var(--color-primary)] text-sm font-semibold hover:underline">
            ← Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const { user, predictions } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Back Link */}
      <Link href="/leaderboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
        <ArrowLeft size={16} />
        Back to Leaderboard
      </Link>

      {/* User Header */}
      <div className="bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-[var(--color-primary)]/20 shrink-0">
            {user.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Predictions history</p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Medal size={14} className="text-[var(--color-gold)]" />
              </div>
              <div className="text-2xl font-extrabold">#{user.rank}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Rank</div>
            </div>
            <div className="w-px h-10 bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Star size={14} className="text-[var(--color-gold)]" />
              </div>
              <div className="text-2xl font-extrabold">{user.points}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions by Race */}
      <div className="space-y-4">
        <h2 className="text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2">
          <FlagTriangleRight size={14} className="text-[var(--color-primary)]" />
          Predictions by Race
        </h2>

        {predictions.map((pred) => (
          <div key={pred.raceId} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {/* Race Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <FlagTriangleRight size={16} className={pred.participated ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"} />
                <div>
                  <h3 className="text-sm font-bold">{pred.raceName}</h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">{pred.raceDate}</p>
                </div>
              </div>
              {pred.participated ? (
                <div className="flex items-center gap-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5 rounded-lg">
                  <Trophy size={13} />
                  <span className="text-xs font-extrabold">+{pred.pointsEarned} pts</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)] px-3 py-1.5 rounded-lg">
                  <X size={13} />
                  <span className="text-xs font-extrabold">No prediction</span>
                </div>
              )}
            </div>

            {/* Predictions Grid */}
            {pred.participated && pred.predictions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
              {/* Race Podium */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Trophy size={13} className="text-[var(--color-text-secondary)]" />
                  <span className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Race Podium</span>
                </div>
                <div className="space-y-2">
                  <PodiumRow position="P1" driver={pred.predictions.race.p1} color="var(--color-gold)" driverNames={driverNames} />
                  <PodiumRow position="P2" driver={pred.predictions.race.p2} color="var(--color-silver)" driverNames={driverNames} />
                  <PodiumRow position="P3" driver={pred.predictions.race.p3} color="var(--color-bronze)" driverNames={driverNames} />
                </div>
              </div>

              {/* Qualifying */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Timer size={13} className="text-[var(--color-text-secondary)]" />
                  <span className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Qualifying</span>
                </div>
                <div className="space-y-2">
                  <PodiumRow position="P1" driver={pred.predictions.qualifying.p1} color="var(--color-gold)" driverNames={driverNames} />
                  <PodiumRow position="P2" driver={pred.predictions.qualifying.p2} color="var(--color-silver)" driverNames={driverNames} />
                  <PodiumRow position="P3" driver={pred.predictions.qualifying.p3} color="var(--color-bronze)" driverNames={driverNames} />
                </div>
              </div>

              {/* Conditions */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <CloudRain size={13} className="text-[var(--color-text-secondary)]" />
                  <span className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Conditions</span>
                </div>
                <div className="space-y-2.5">
                  <ConditionRow icon={<ShieldAlert size={13} />} label="Safety Car" value={pred.predictions.conditions.safetyCar} />
                  <ConditionRow icon={<CloudRain size={13} />} label="Rain" value={pred.predictions.conditions.rain} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <AlertTriangle size={13} />
                      <span className="text-xs font-medium">DNFs</span>
                    </div>
                    <span className="text-xs font-extrabold">{pred.predictions.conditions.dnfCount}</span>
                  </div>
                </div>
              </div>

              {/* Pole Time */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock size={13} className="text-[var(--color-text-secondary)]" />
                  <span className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Pole Time</span>
                </div>
                <div className="flex items-center justify-center py-3">
                  <span className="text-lg font-extrabold font-mono tracking-wider">
                    {pred.predictions.poleTime.minutes}:{pred.predictions.poleTime.seconds}:{pred.predictions.poleTime.milliseconds}
                  </span>
                </div>
              </div>
            </div>
            ) : (
              <div className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                This user did not submit a prediction for this race.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PodiumRow({ position, driver, color, driverNames }: { position: string; driver: string; color: string; driverNames: Record<string, string> }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white" style={{ backgroundColor: color }}>
        {position.replace("P", "")}
      </div>
      <span className="text-xs font-bold">{driver}</span>
      <span className="text-[11px] text-[var(--color-text-secondary)]">{driverNames[driver] || driver}</span>
    </div>
  );
}

function ConditionRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      {value ? (
        <div className="flex items-center gap-1 text-[var(--color-green)]">
          <Check size={12} />
          <span className="text-[10px] font-bold">Yes</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
          <X size={12} />
          <span className="text-[10px] font-bold">No</span>
        </div>
      )}
    </div>
  );
}
