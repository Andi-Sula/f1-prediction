"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  rank: number;
  username: string;
  initials: string;
  points: number;
  wins: number | null;
  correct: number | null;
}

interface CompletedRace {
  id: string;
  round: number;
  name: string;
  country: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [completedRaces, setCompletedRaces] = useState<CompletedRace[]>([]);
  const [activeTab, setActiveTab] = useState("season");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(setLeaderboard)
      .catch(() => {});
    fetch("/api/races")
      .then(r => r.json())
      .then((races: { id: string; round: number; name: string; country: string; status: string }[]) => {
        const done = races
          .filter(r => r.status === "completed")
          .sort((a, b) => b.round - a.round)
          .slice(0, 3);
        setCompletedRaces(done);
      })
      .catch(() => {});
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">LEADERBOARD</h1>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-6 border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab("season")}
            className={`pb-3 text-sm tracking-wider transition-colors relative ${
              activeTab === "season" ? "text-white font-medium" : "text-[var(--color-text-secondary)]/50 font-normal hover:text-[var(--color-text-secondary)]"
            }`}
          >
            SEASON TOTAL
            {activeTab === "season" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-primary)]" />}
          </button>
          {completedRaces.map(race => (
            <button
              key={race.id}
              onClick={() => setActiveTab(race.id)}
              className={`pb-3 text-sm tracking-wider transition-colors relative ${
                activeTab === race.id ? "text-white font-medium" : "text-[var(--color-text-secondary)]/50 font-normal hover:text-[var(--color-text-secondary)]"
              }`}
            >
              <span className="mr-1">{race.country}</span>RD{race.round}
              {activeTab === race.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-primary)]" />}
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {podiumOrder.map((user, idx) => {
                  const actualRank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                  const colors = ["var(--color-silver)", "var(--color-gold)", "var(--color-bronze)"];
                  const borderColors = ["var(--color-silver)", "var(--color-gold)", "var(--color-bronze)"];
                  return (
                    <div
                      key={user.id}
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-5 text-center"
                      style={{ borderTopWidth: "3px", borderTopColor: borderColors[idx] }}
                    >
                      {actualRank === 1 && <div className="text-[10px] font-extrabold text-[var(--color-gold)] tracking-wider mb-1">◆ LEADER</div>}
                      <div className="text-3xl font-black text-[var(--color-text-secondary)]">{actualRank}</div>
                      <div
                        className="w-12 h-12 rounded-full mx-auto mt-3 flex items-center justify-center text-white font-extrabold text-sm"
                        style={{ backgroundColor: colors[idx], border: `3px solid ${borderColors[idx]}` }}
                      >
                        {user.initials}
                      </div>
                      <div className="mt-3 text-sm font-extrabold">{user.username}</div>
                      <div className="text-2xl font-black mt-1" style={{ color: actualRank === 1 ? "var(--color-gold)" : "var(--color-text)" }}>
                        {user.points}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                        {user.wins ?? "-"} win{user.wins !== 1 ? "s" : ""} · {user.correct ?? "-"} correct
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded overflow-hidden">
              <div className="grid grid-cols-[3rem_1fr_5rem_4rem_5rem] px-5 py-3 border-b border-[var(--color-border)] text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">
                <span>#</span>
                <span>PREDICTOR</span>
                <span className="text-right">POINTS</span>
                <span className="text-right">WINS</span>
                <span className="text-right">CORRECT</span>
              </div>

              {leaderboard.map((user, i) => (
                <Link
                  key={user.id}
                  href={`/leaderboard/${user.id}`}
                  className={`grid grid-cols-[3rem_1fr_5rem_4rem_5rem] px-5 py-3.5 items-center hover:bg-[var(--color-border)]/20 transition-colors ${
                    i > 0 ? "border-t border-[var(--color-border)]" : ""
                  }`}
                >
                  <span className="text-sm font-extrabold" style={{ color: user.rank === 1 ? 'var(--color-gold)' : user.rank === 2 ? 'var(--color-silver)' : user.rank === 3 ? 'var(--color-bronze)' : 'var(--color-text-secondary)' }}>
                    {user.rank}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-sm bg-[var(--color-border)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)] shrink-0">
                      {user.initials}
                    </div>
                    <span className="text-sm font-bold truncate">{user.username}</span>
                  </div>
                  <span className="text-sm font-extrabold font-mono tabular-nums text-right">{user.points}</span>
                  <span className="text-sm font-mono tabular-nums text-right text-[var(--color-gold)]">{user.wins ?? "-"}</span>
                  <span className="text-sm font-mono tabular-nums text-right">{user.correct ?? "-"}</span>
                </Link>
              ))}

              {leaderboard.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] p-5">No leaderboard data yet</p>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            {/* Round Winners */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-5">
              <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] mb-4">ROUND WINNERS</div>
              {completedRaces.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">No completed races yet</p>
              )}
              {completedRaces.map(race => (
                <div key={race.id} className={`py-3 ${completedRaces.indexOf(race) > 0 ? "border-t border-[var(--color-border)]" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-extrabold text-[var(--color-text-secondary)] shrink-0">{race.country}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-[var(--color-text-secondary)]">ROUND {race.round} — {race.name.replace(" Grand Prix", " GP").toUpperCase()}</div>
                      <div className="text-sm font-extrabold mt-0.5">—</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scoring Guide */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-5">
              <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] mb-4">SCORING GUIDE</div>
              <div className="space-y-3">
                <ScoreRow icon="🏆" label="Race Podium" pts="+58" />
                <ScoreRow icon="🌧️" label="Race Conditions" pts="+20" />
                <ScoreRow icon="⚡" label="Qualifying Pole" pts="+51" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ icon, label, pts }: { icon: string; label: string; pts: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <span className="text-sm font-extrabold text-[var(--color-primary)]">{pts}</span>
    </div>
  );
}
