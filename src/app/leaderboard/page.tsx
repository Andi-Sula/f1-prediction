"use client";

import { useEffect, useState } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  rank: number;
  username: string;
  name: string;
  points: number;
  avatar: string;
  wins: number;
  correct: number;
}

interface Race {
  id: string;
  name: string;
  date: string;
  status: string;
}

interface RoundWinner {
  raceId: string;
  raceName: string;
  roundNumber: number;
  top3: { username: string; points: number; rank: number }[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [raceScores, setRaceScores] = useState<Record<string, User[]>>({});
  const [roundWinners, setRoundWinners] = useState<RoundWinner[]>([]);
  const [activeTab, setActiveTab] = useState("season");
  const [loading, setLoading] = useState(true);

  const completedRaces = races.filter(r => r.status === "completed").slice(-3).reverse();

  useEffect(() => {
    async function load() {
      try {
        const [lbRes, racesRes] = await Promise.all([
          fetch("/api/leaderboard"),
          fetch("/api/races"),
        ]);
        const lbData = await lbRes.json();
        const racesData: Race[] = await racesRes.json();

        setLeaderboard(lbData);
        setRaces(racesData);

        // Fetch scores for last 3 completed races
        const completed = racesData.filter(r => r.status === "completed").slice(-3);
        const scores: Record<string, User[]> = {};
        const winners: RoundWinner[] = [];

        for (const race of completed) {
          const res = await fetch(`/api/leaderboard?raceId=${race.id}`);
          if (res.ok) {
            const data = await res.json();
            scores[race.id] = data;
            if (data.length > 0) {
              const roundNum = racesData.findIndex(r => r.id === race.id) + 1;
              winners.push({
                raceId: race.id,
                raceName: race.name.replace(" Grand Prix", " GP"),
                roundNumber: roundNum,
                top3: data.slice(0, 3).map((u: any, i: number) => ({
                  username: u.username || u.name,
                  points: u.points,
                  rank: i + 1,
                })),
              });
            }
          }
        }

        setRaceScores(scores);
        setRoundWinners(winners.reverse());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const activeData = activeTab === "season"
    ? leaderboard
    : raceScores[activeTab] || [];

  const top3 = activeData.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const badgeColor = (rank: number) =>
    rank === 1 ? "var(--color-gold)" : rank === 2 ? "var(--color-silver)" : rank === 3 ? "var(--color-bronze)" : "transparent";

  const shortName = (name: string) => name.replace(" Grand Prix", " GP");

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
        <span className="text-[var(--color-primary)]">LEADER</span>BOARD
      </h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab("season")}
          className={`pb-2 text-sm font-bold uppercase tracking-wide transition-colors ${
            activeTab === "season"
              ? "text-[var(--color-text)] border-b-2 border-[var(--color-primary)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          Season Total
        </button>
        {completedRaces.map((race, i) => (
          <button
            key={race.id}
            onClick={() => setActiveTab(race.id)}
            className={`pb-2 text-sm font-bold uppercase tracking-wide transition-colors ${
              activeTab === race.id
                ? "text-[var(--color-text)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            RD{races.findIndex(r => r.id === race.id) + 1} {shortName(race.name).split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-3">
              {podiumOrder.map((user) => (
                <div
                  key={user.id}
                  className={`bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center ${
                    user.rank === 1 ? "ring-2 ring-[var(--color-gold)]/30" : ""
                  }`}
                >
                  {user.rank === 1 && (
                    <div className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1">
                      ◆ Leader
                    </div>
                  )}
                  <div className={`text-lg font-black ${
                    user.rank === 1 ? "text-[var(--color-gold)]" :
                    user.rank === 2 ? "text-[var(--color-silver)]" :
                    "text-[var(--color-bronze)]"
                  }`}>{user.rank}</div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto my-2"
                    style={{ backgroundColor: badgeColor(user.rank) }}
                  >
                    {user.avatar}
                  </div>
                  <div className="text-sm font-bold truncate">{user.username || user.name}</div>
                  <div className="text-xl font-black mt-1">{user.points}</div>
                </div>
              ))}
            </div>
          )}

          {/* Rankings Table */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="grid grid-cols-[50px_1fr_80px] px-4 py-2.5 border-b border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <span>#</span>
              <span>Predictor</span>
              <span className="text-right">Points</span>
            </div>
            {activeData.map((user, i) => (
              <Link
                key={user.id}
                href={`/leaderboard/${user.id}`}
                className={`grid grid-cols-[50px_1fr_80px] items-center px-4 py-3 hover:bg-[var(--color-background)] transition-colors ${
                  i > 0 ? "border-t border-[var(--color-border)]" : ""
                } ${user.rank === 1 ? "bg-[var(--color-primary)]/5" : ""}`}
              >
                <span className={`text-sm font-bold ${
                  user.rank === 1 ? "text-[var(--color-gold)]" :
                  user.rank === 2 ? "text-[var(--color-silver)]" :
                  user.rank === 3 ? "text-[var(--color-bronze)]" :
                  "text-[var(--color-text-secondary)]"
                }`}>
                  {user.rank}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                    {user.avatar}
                  </div>
                  <span className="text-sm font-semibold">{user.username || user.name}</span>
                </div>
                <span className="text-sm font-bold text-right">{user.points}</span>
              </Link>
            ))}
            {activeData.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] p-5 text-center">No data available</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Round Winners */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <h3 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">Round Winners</h3>
            <div className="space-y-3">
              {roundWinners.length > 0 ? roundWinners.map((w, i) => (
                <div key={w.raceId} className={`${i > 0 ? "pt-3 border-t border-[var(--color-border)]" : ""}`}>
                  <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">
                    Round {w.roundNumber} — {w.raceName}
                  </div>
                  <div className="space-y-1 mt-1.5">
                    {w.top3.map((u) => (
                      <div key={u.rank} className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                          style={{ backgroundColor: badgeColor(u.rank) }}
                        >
                          {u.rank}
                        </span>
                        <span className={`text-sm font-bold truncate ${u.rank === 1 ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}>{u.username}</span>
                        <span className="text-[10px] text-[var(--color-text-secondary)] ml-auto shrink-0">{u.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-[var(--color-text-secondary)]">No completed races yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
