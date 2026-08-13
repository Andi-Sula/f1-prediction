"use client";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";

interface Race {
  id: string;
  round: number;
  name: string;
  qualifying_time: string | null;
  race_time: string | null;
  status: string;
}

function CountdownBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="border border-white/20 rounded-sm px-4 py-3 bg-white/5 min-w-[60px]">
        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">{value}</span>
      </div>
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1.5">{label}</div>
    </div>
  );
}

function getTimeLeft(target: string) {
  // Predictions close 5 minutes before qualifying
  const diff = new Date(target).getTime() - 5 * 60 * 1000 - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function HomeHero() {
  const { user, loading } = useAuth();
  const [race, setRace] = useState<Race | null>(null);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetch("/api/races").then(r => r.json()).then((data: Race[]) => {
      const active = data.find(r => ["qualifying", "waiting_race", "racing"].includes(r.status));
      const upcoming = data.find(r => r.status === "upcoming");
      setRace(active || upcoming || data[0] || null);
    }).catch(() => {});
    fetch("/api/leaderboard").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setTotalUsers(data.length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!race?.qualifying_time || race.status !== "upcoming") return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(race.qualifying_time!));
    }, 1000);
    setTimeLeft(getTimeLeft(race.qualifying_time));
    return () => clearInterval(interval);
  }, [race]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const isOpen = race?.status === "upcoming";
  const gpName = race?.name?.replace(" Grand Prix", "")?.toUpperCase() || "NEXT RACE";

  if (loading) {
    return (
      <div className="rounded bg-[var(--color-hero-bg)] p-8 sm:p-12">
        <div className="h-32 animate-pulse bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-hero-bg)] overflow-hidden relative">
      {/* Diagonal red stripes background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.09]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 20px, var(--color-primary) 20px, var(--color-primary) 22px)",
        }}
      />
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 relative z-10">
        {/* Status badge */}
        {isOpen && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-[11px] font-extrabold text-[var(--color-primary)] tracking-[0.15em] uppercase">PREDICTIONS OPEN</span>
          </div>
        )}

        {race && (
          <div className="text-[11px] font-bold text-white/40 tracking-[0.12em] uppercase mb-3">
            ROUND {race.round} OF 21 — 2026 SEASON
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Left: GP Name + CTA */}
          <div className="flex-1">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[0.9] tracking-tight">
              {gpName}
            </h1>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-primary)] leading-[0.9] mt-1">
              GRAND PRIX
            </h2>

            {race?.qualifying_time && (
              <p className="text-sm text-white/50 mt-4">
                {(() => {
                  const qualiDate = new Date(race.qualifying_time);
                  const raceDate = race.race_time ? new Date(race.race_time) : null;
                  if (raceDate && raceDate.getTime() !== qualiDate.getTime()) {
                    if (qualiDate.getMonth() === raceDate.getMonth()) {
                      return `${qualiDate.toLocaleDateString("en-US", { month: "long" })} ${qualiDate.getDate()}-${raceDate.getDate()}, ${raceDate.getFullYear()}`;
                    }
                    return `${qualiDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${raceDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${raceDate.getFullYear()}`;
                  }
                  return qualiDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                })()}
              </p>
            )}

            {!user ? (
              <div className="mt-6">
                <Link href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white text-xs font-extrabold tracking-[0.1em] uppercase rounded-sm hover:opacity-90 transition-all">
                  <LogIn size={16} />
                  SIGN IN TO PREDICT
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/predictions"
                  className="px-6 py-3 bg-[var(--color-primary)] text-white text-xs font-extrabold tracking-[0.1em] uppercase rounded-sm hover:opacity-90 transition-all">
                  MAKE PREDICTIONS
                </Link>
                <Link href="/leaderboard"
                  className="px-6 py-3 border border-white/20 text-white text-xs font-extrabold tracking-[0.1em] uppercase rounded-sm hover:bg-white/5 transition-all">
                  VIEW STANDINGS
                </Link>
              </div>
            )}
          </div>

          {/* Right: Countdown + Stats */}
          <div className="flex flex-col gap-4">
            {isOpen && timeLeft && (
              <div>
                <div className="text-[10px] font-bold text-white/40 tracking-[0.15em] uppercase mb-3">PREDICTIONS CLOSE IN</div>
                <div className="flex gap-2">
                  <CountdownBlock value={pad(timeLeft.days)} label="DAYS" />
                  <CountdownBlock value={pad(timeLeft.hours)} label="HRS" />
                  <CountdownBlock value={pad(timeLeft.minutes)} label="MIN" />
                  <CountdownBlock value={pad(timeLeft.seconds)} label="SEC" />
                </div>
              </div>
            )}

            <div className="flex border border-white/10 rounded-sm overflow-hidden divide-x divide-white/10">
              <div className="px-5 py-3 text-center flex-1">
                <div className="text-lg font-extrabold text-[var(--color-primary)] font-mono">{totalUsers.toLocaleString()}</div>
                <div className="text-[9px] font-bold text-white/40 tracking-wider uppercase">PREDICTORS</div>
              </div>
              <div className="px-5 py-3 text-center flex-1">
                <div className="text-lg font-extrabold text-white font-mono">{user?.points || 0}</div>
                <div className="text-[9px] font-bold text-white/40 tracking-wider uppercase">YOUR PTS</div>
              </div>
              <div className="px-5 py-3 text-center flex-1">
                <div className="text-lg font-extrabold text-[var(--color-primary)] font-mono">#{user?.rank || "—"}</div>
                <div className="text-[9px] font-bold text-white/40 tracking-wider uppercase">YOUR RANK</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
