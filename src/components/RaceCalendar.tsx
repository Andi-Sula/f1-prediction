"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Race {
  id: string;
  round: number;
  name: string;
  circuit: string;
  country: string;
  date: string;
  qualifying_time: string | null;
  race_time: string | null;
  status: "completed" | "upcoming" | "qualifying" | "race_day" | "cancelled";
}

export default function RaceCalendar() {
  const [races, setRaces] = useState<Race[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/races").then(r => r.json()).then(setRaces).catch(() => {});
  }, []);

  useEffect(() => {
    if (!races.length || !trackRef.current) return;
    // Focus: active race first, then first upcoming, else nothing
    let idx = races.findIndex(r => ["qualifying", "race_day"].includes(r.status));
    if (idx < 0) idx = races.findIndex(r => r.status === "upcoming");
    if (idx < 0) return;
    const el = trackRef.current.children[idx] as HTMLElement;
    if (el) trackRef.current.scrollTo({ left: el.offsetLeft - trackRef.current.offsetWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
  }, [races]);

  const scroll = (dir: number) => trackRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  const shortName = (name: string) => name.replace(" Grand Prix", " GP").toUpperCase();

  const fmtDate = (race: Race) => {
    const dt = race.qualifying_time;
    if (!dt) return null;
    const qualiDate = new Date(dt);
    const raceDate = race.race_time ? new Date(race.race_time) : null;
    if (raceDate && raceDate.getTime() !== qualiDate.getTime()) {
      if (qualiDate.getMonth() === raceDate.getMonth()) {
        return `${qualiDate.toLocaleDateString("en-US", { month: "short" })} ${qualiDate.getDate()}-${raceDate.getDate()}, ${raceDate.getFullYear()}`;
      }
      return `${qualiDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${raceDate.getFullYear()}`;
    }
    return qualiDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const completed = races.filter(r => r.status === "completed" || r.status === "cancelled").length;

  return (
    <div className="bg-[var(--color-hero-bg)] rounded overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="text-[10px] font-extrabold text-white/40 tracking-[0.15em] uppercase">
          2026 SEASON CALENDAR
        </div>
      </div>

      {/* Horizontal card track */}
      <div className="relative px-6">
        <button onClick={() => scroll(-1)} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft size={14} className="text-white/60" />
        </button>
        <button onClick={() => scroll(1)} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronRight size={14} className="text-white/60" />
        </button>

        <div ref={trackRef} className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1" style={{ scrollbarWidth: "none" }}>
          {races.map((race) => {
            const isLive = ["qualifying", "race_day"].includes(race.status);
            const hasActive = races.some(r => ["qualifying", "race_day"].includes(r.status));
            const isNextUpcoming = !hasActive && race.status === "upcoming" && race.id === races.find(r => r.status === "upcoming")?.id;
            const isDone = race.status === "completed";
            const isCancelled = race.status === "cancelled";

            return (
              <div
                key={race.id}
                className={`shrink-0 w-[150px] sm:w-[170px] rounded p-4 border transition-colors ${
                  isLive
                    ? "bg-white/[0.07] border-t-2 border-t-[var(--color-primary)] border-l-white/10 border-r-white/10 border-b-white/10"
                    : isNextUpcoming
                    ? "bg-white/[0.07] border-t-2 border-t-[var(--color-gold)] border-l-white/10 border-r-white/10 border-b-white/10"
                    : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
                }`}
              >
                <div className={`text-[10px] font-extrabold tracking-wider mb-1.5 ${
                  isLive ? "text-[var(--color-primary)]" : isNextUpcoming ? "text-[var(--color-gold)]" : "text-white/30"
                }`}>
                  RD {race.round}
                </div>
                <div className={`text-sm font-extrabold leading-tight ${
                  isLive || isNextUpcoming ? "text-white" : isDone ? "text-white/70" : "text-white/50"
                }`}>
                  {shortName(race.name)}
                </div>
                <div className="text-[11px] text-white/30 mt-1.5 font-mono">
                  {fmtDate(race) || "TBD"}
                </div>
                {isLive && (
                  <div className="text-[10px] font-extrabold text-[var(--color-primary)] mt-2">● LIVE</div>
                )}
                {isNextUpcoming && (
                  <div className="text-[10px] font-extrabold text-[var(--color-gold)] mt-2">● UPCOMING</div>
                )}
                {isDone && (
                  <div className="text-[10px] font-extrabold text-[var(--color-green)] mt-2">✓ RESULTS IN</div>
                )}
                {isCancelled && (
                  <div className="text-[10px] font-extrabold text-white/30 mt-2 line-through">CANCELLED</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-green)] to-[var(--color-primary)] rounded-full transition-all duration-500"
            style={{ width: `${(completed / Math.max(races.length, 1)) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-white/30 shrink-0">
          {completed}/{races.length} RACES
        </span>
      </div>
    </div>
  );
}
