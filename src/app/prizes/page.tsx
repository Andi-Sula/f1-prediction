"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Tv, ChevronRight } from "lucide-react";

interface Race {
  id: string;
  name: string;
  status: string;
  qualifying_time: string | null;
}

interface Prize {
  position: number;
  icon_url: string | null;
  label: string | null;
}

const positionMeta: Record<number, { tag: string; color: string; glow: string; border: string; icon: string }> = {
  1: { tag: "1ST PLACE", color: "var(--color-gold)", glow: "0 0 20px rgba(255,215,0,0.25), 0 0 40px rgba(255,215,0,0.1)", border: "var(--color-gold)", icon: "🥇" },
  2: { tag: "2ND PLACE", color: "var(--color-silver)", glow: "0 0 20px rgba(192,192,192,0.25), 0 0 40px rgba(192,192,192,0.1)", border: "var(--color-silver)", icon: "🥈" },
  3: { tag: "3RD PLACE", color: "var(--color-bronze)", glow: "0 0 20px rgba(205,127,50,0.25), 0 0 40px rgba(205,127,50,0.1)", border: "var(--color-bronze)", icon: "🥉" },
};

export default function PrizesPage() {
  const [liveRace, setLiveRace] = useState<Race | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    fetch("/api/races")
      .then(r => r.json())
      .then((races: Race[]) => {
        const active = races.find(r => ["qualifying", "race_day", "upcoming"].includes(r.status));
        if (active) setLiveRace(active);
      })
      .catch(() => {});

    fetch("/api/prizes")
      .then(r => r.json())
      .then((data: Prize[]) => setPrizes(data))
      .catch(() => {});
  }, []);

  // Order: 2nd, 1st, 3rd (1st in the middle)
  const ordered = [
    prizes.find(p => p.position === 2),
    prizes.find(p => p.position === 1),
    prizes.find(p => p.position === 3),
  ].filter(Boolean) as Prize[];

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-[11px] font-extrabold text-[var(--color-primary)] tracking-[0.2em]">WIN REAL F1 MERCHANDISE</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-[var(--color-primary)]">PRIZES</span> & REWARDS
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Every race weekend is a chance to win. The best predictors take home the best gear.
          </p>
        </div>

        {/* Prize Cards — 2nd | 1st | 3rd */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {ordered.map((prize) => {
            const meta = positionMeta[prize.position];
            const isFirst = prize.position === 1;
            return (
              <div
                key={prize.position}
                className={`bg-[var(--color-surface)] rounded overflow-hidden text-center ${isFirst ? "sm:-mt-4" : ""}`}
                style={{ border: `2px solid ${meta.border}`, boxShadow: meta.glow }}
              >
                <div className={`${isFirst ? "h-48" : "h-40"} bg-[var(--color-border)]/20 flex items-center justify-center`}>
                  {prize.icon_url ? (
                    <img src={prize.icon_url} alt={prize.label || ""} className="max-h-full max-w-full object-contain p-4" />
                  ) : (
                    <span className={`${isFirst ? "text-6xl" : "text-5xl"}`}>{meta.icon}</span>
                  )}
                </div>
                <div className="p-5">
                  <span
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-sm tracking-wider inline-block"
                    style={{ backgroundColor: meta.color, color: "#000" }}
                  >
                    {meta.tag}
                  </span>
                  <h3 className="text-sm font-extrabold mt-3 uppercase tracking-wide">
                    {prize.label || "—"}
                  </h3>
                </div>
              </div>
            );
          })}
          {ordered.length === 0 && (
            <div className="sm:col-span-3 text-center py-10 text-sm text-[var(--color-text-secondary)]">
              No prizes published yet.
            </div>
          )}
        </div>

        {/* How to Boost Points */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-[11px] font-extrabold text-[var(--color-primary)] tracking-[0.2em]">BOOST YOUR SCORE</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">HOW TO BOOST POINTS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {/* Raiffeisen Boost */}
            <Link href="/profile" className="block bg-[#FFDD00] rounded p-5 group hover:brightness-105 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-black/10 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-black">Raiffeisen Boost</h3>
                    <span className="bg-black text-[#FFDD00] text-[10px] font-extrabold px-2 py-0.5 rounded-sm">+15 PTS</span>
                  </div>
                  <p className="text-xs text-black/70 mb-2">Enter your Raiffeisen card digits in your profile to earn bonus points each race.</p>
                  <div className="flex items-center gap-1 text-black text-xs font-bold">
                    Link in Profile <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* DigitAlb 2× Points */}
            <Link href="/profile" className="block bg-[var(--color-primary)] rounded p-5 shadow-lg shadow-[var(--color-primary)]/20 group hover:brightness-110 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center shrink-0">
                  <Tv size={20} className="text-[var(--color-primary)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-white">DigitAlb 2× Points</h3>
                    <span className="bg-white text-[var(--color-primary)] text-[10px] font-extrabold px-2 py-0.5 rounded-sm">2× MULTIPLIER</span>
                  </div>
                  <p className="text-xs text-white/80 mb-2">Add your subscriber ID in your profile to double your points — usable in 3 races per season.</p>
                  <div className="flex items-center gap-1 text-white text-xs font-bold">
                    Link in Profile <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Live Round CTA */}
        {liveRace && (
          <div className="bg-[var(--color-surface)] border-t-[3px] border-t-[var(--color-primary)] border border-[var(--color-border)] rounded p-10 text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight">
              {liveRace.name.replace(" Grand Prix", " GP").toUpperCase()} IS LIVE
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {liveRace.name} predictions are open. Don&apos;t miss your chance at the round prize.
            </p>
            <Link
              href="/predictions"
              className="inline-block bg-[var(--color-primary)] text-white px-8 py-3.5 rounded-sm text-sm font-extrabold tracking-wider hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              MAKE YOUR PICKS →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
