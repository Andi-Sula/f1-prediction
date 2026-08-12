"use client";
import { useEffect, useRef, useState } from "react";
import {
  FlagTriangleRight,
  MapPin,
  CalendarDays,
  Trophy,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Zap,
  Calendar,
  Ban,
} from "lucide-react";
import QualifyingCountdown from "./QualifyingCountdown";

interface Race {
  id: string;
  round: number;
  name: string;
  circuit: string;
  country: string;
  date: string;
  race_time: string | null;
  qualifying_time: string | null;
  status: "completed" | "active" | "upcoming" | "qualifying" | "waiting_race" | "racing" | "cancelled";
}

const FLAG: Record<string, string> = {
  BH: "🇧🇭", SA: "🇸🇦", AU: "🇦🇺", JP: "🇯🇵", CN: "🇨🇳", US: "🇺🇸",
  IT: "🇮🇹", MC: "🇲🇨", ES: "🇪🇸", CA: "🇨🇦", AT: "🇦🇹", GB: "🇬🇧",
  BE: "🇧🇪", HU: "🇭🇺", NL: "🇳🇱", AZ: "🇦🇿", SG: "🇸🇬", MX: "🇲🇽",
  BR: "🇧🇷", QA: "🇶🇦", AE: "🇦🇪",
};

export default function RaceCalendar() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selected, setSelected] = useState<Race | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/races").then(r => r.json()).then(setRaces).catch(() => {});
  }, []);

  useEffect(() => {
    if (!races.length || !trackRef.current) return;
    const idx = races.findIndex(r => ["active", "qualifying", "waiting_race", "racing"].includes(r.status));
    if (idx < 0) return;
    const el = trackRef.current.children[idx] as HTMLElement;
    if (el) trackRef.current.scrollTo({ left: el.offsetLeft - trackRef.current.offsetWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
  }, [races]);

  const scroll = (dir: number) => trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  const fmtMonth = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short" });
  const fmtDay = (d: string) => new Date(d).getDate();
  const raceDate = (race: Race) => race.qualifying_time || null;
  const shortName = (name: string) => name.replace(" Grand Prix", " GP");

  return (
    <>
      {/* Track container */}
      <div className="relative bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 sm:p-5 overflow-visible">
        {/* Scroll arrows */}
        <button onClick={() => scroll(-1)} className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] items-center justify-center hover:border-[var(--color-primary)] hover:scale-110 transition-all shadow-xl hidden sm:flex">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => scroll(1)} className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] items-center justify-center hover:border-[var(--color-primary)] hover:scale-110 transition-all shadow-xl hidden sm:flex">
          <ChevronRight size={14} />
        </button>

        {/* Track line */}
        <div className="relative overflow-visible">
          {/* The connecting line */}
          <div className="absolute top-[46px] sm:top-[50px] left-0 right-0 h-[2px] bg-[var(--color-border)]" />

          {/* Race nodes */}
          <div ref={trackRef} className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide relative pt-2 pb-1" style={{ scrollbarWidth: "none" }}>
            {races.map((race) => {
              const isRacing = race.status === "racing";
              const isRaceWeek = race.status === "qualifying" || race.status === "waiting_race";
              const isCurrent = isRacing || isRaceWeek;
              const isDone = race.status === "completed";
              const isCancelled = race.status === "cancelled";
              const flag = FLAG[race.country] || "🏁";

              const badgeLabel = race.status === "qualifying" ? "QUALIFYING"
                : race.status === "waiting_race" ? "RACE WEEK"
                : race.status === "racing" ? "LIVE"
                : null;

              return (
                <button
                  key={race.id}
                  onClick={() => setSelected(race)}
                  className={`group shrink-0 flex flex-col items-center w-[82px] sm:w-[96px] pb-2 relative ${isCurrent ? "pt-6" : "pt-2"}`}
                >
                  {/* Node circle */}
                  <div className={`relative z-10 w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                    isRacing
                      ? "bg-[var(--color-primary)] shadow-[0_0_20px_rgba(225,6,0,0.6),0_0_40px_rgba(225,6,0,0.2)] ring-2 ring-[var(--color-primary)]/30 ring-offset-2 ring-offset-[var(--color-surface)] scale-110"
                      : isRaceWeek
                      ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5),0_0_40px_rgba(245,158,11,0.15)] ring-2 ring-amber-400/30 ring-offset-2 ring-offset-[var(--color-surface)] scale-110"
                      : isDone
                      ? "bg-[var(--color-surface)] border-2 border-[var(--color-green)]/40 group-hover:border-[var(--color-green)] group-hover:scale-105"
                      : isCancelled
                      ? "bg-[var(--color-surface)] border-2 border-[var(--color-text-secondary)]/20 opacity-50"
                      : "bg-[var(--color-surface)] border-2 border-[var(--color-border)] group-hover:border-[var(--color-text-secondary)] group-hover:scale-105"
                  }`}>
                    {isRacing ? (
                      <span className="text-base">{flag}</span>
                    ) : isRaceWeek ? (
                      <span className="text-base">{flag}</span>
                    ) : isDone ? (
                      <Check size={16} className="text-[var(--color-green)]" />
                    ) : isCancelled ? (
                      <Ban size={16} className="text-[var(--color-text-secondary)]/40" />
                    ) : (
                      <span className="text-sm opacity-60">{flag}</span>
                    )}
                    {isRacing && (
                      <div className="absolute -inset-1 rounded-full animate-[ping_2s_ease-in-out_infinite] bg-[var(--color-primary)]/15" />
                    )}
                    {isRaceWeek && (
                      <div className="absolute -inset-1 rounded-full animate-[ping_2s_ease-in-out_infinite] bg-amber-500/15" />
                    )}
                  </div>

                  {/* Round label */}
                  <div className={`mt-2 text-[10px] sm:text-[11px] font-extrabold tracking-wide ${
                    isRacing ? "text-[var(--color-primary)]" : isRaceWeek ? "text-amber-500" : isDone ? "text-[var(--color-text-secondary)]/60" : isCancelled ? "text-[var(--color-text-secondary)]/30 line-through" : "text-[var(--color-text-secondary)]/80"
                  }`}>
                    R{race.round}
                  </div>

                  {/* Race name */}
                  <div className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight mt-0.5 max-w-full px-1 ${
                    isCurrent ? "text-[var(--color-text)]" : isCancelled ? "text-[var(--color-text-secondary)]/30 line-through" : "text-[var(--color-text-secondary)]/60"
                  }`}>
                    {shortName(race.name)}
                  </div>

                  {/* Date */}
                  {raceDate(race) ? (
                    <div className={`flex items-baseline gap-0.5 mt-1 ${
                      isCurrent ? "text-[var(--color-text-secondary)]" : isCancelled ? "text-[var(--color-text-secondary)]/20" : "text-[var(--color-text-secondary)]/40"
                    }`}>
                      <span className="text-[10px] font-bold">{fmtDay(raceDate(race)!)}</span>
                      <span className="text-[9px] font-semibold">{fmtMonth(raceDate(race)!)}</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[9px] text-[var(--color-text-secondary)]/30 font-semibold">TBD</div>
                  )}

                  {/* Status badge */}
                  {badgeLabel && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <div className={`text-white text-[8px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1 whitespace-nowrap ${
                        isRacing ? "bg-[var(--color-primary)] shadow-[var(--color-primary)]/30" : "bg-amber-500 shadow-amber-500/30"
                      }`}>
                        <Calendar size={9} /> {badgeLabel}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-green)] to-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${(races.filter(r => r.status === "completed" || r.status === "cancelled").length / Math.max(races.length, 1)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-[var(--color-text-secondary)] shrink-0">
            {races.filter(r => r.status === "completed" || r.status === "cancelled").length}/{races.length} races
          </span>
        </div>

        {/* Countdown for next upcoming race (only when no race is currently active) */}
        {(() => {
          const hasActive = races.some(r => ["qualifying", "waiting_race", "racing", "active"].includes(r.status));
          if (hasActive) return null;
          const nextUpcoming = races.find(r => r.status === "upcoming" && r.qualifying_time);
          if (!nextUpcoming) return null;
          return <div className="mt-4"><QualifyingCountdown qualifyingTime={nextUpcoming.qualifying_time!} /></div>;
        })()}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60]" onClick={() => setSelected(null)}>
          <div
            className="bg-[var(--color-surface)] rounded-t-3xl sm:rounded-2xl border border-[var(--color-border)] w-full sm:max-w-lg shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className={`h-1 ${
              selected.status === "racing" ? "bg-[var(--color-primary)]" :
              ["qualifying", "waiting_race"].includes(selected.status) ? "bg-amber-500" :
              selected.status === "completed" ? "bg-[var(--color-green)]" :
              selected.status === "cancelled" ? "bg-[var(--color-text-secondary)]" : "bg-[var(--color-border)]"
            }`} />

            <div className="p-5 sm:p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{FLAG[selected.country] || "🏁"}</div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">{selected.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Round {selected.round} of {races.length}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center transition-colors shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-background)] rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin size={12} className="text-[var(--color-text-secondary)]" />
                    <span className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Circuit</span>
                  </div>
                  <div className="text-sm font-bold leading-snug">{selected.circuit}</div>
                </div>
                <div className="bg-[var(--color-background)] rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CalendarDays size={12} className="text-[var(--color-text-secondary)]" />
                    <span className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Race Day</span>
                  </div>
                  <div className="text-sm font-bold font-mono">{selected.date}</div>
                  {selected.race_time && (
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {new Date(selected.race_time).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl ${
                selected.status === "racing" ? "bg-[var(--color-primary)]/10" :
                ["qualifying", "waiting_race"].includes(selected.status) ? "bg-amber-500/10" :
                selected.status === "completed" ? "bg-[var(--color-green)]/10" :
                selected.status === "cancelled" ? "bg-[var(--color-text-secondary)]/10" : "bg-[var(--color-border)]/20"
              }`}>
                {selected.status === "qualifying" ? (
                  <>
                    <div className="relative">
                      <FlagTriangleRight size={18} className="text-amber-500" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-500">Qualifying in Progress</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">Predictions are locked</div>
                    </div>
                  </>
                ) : selected.status === "waiting_race" ? (
                  <>
                    <div className="relative">
                      <Clock size={18} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-500">Waiting for Race</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">Qualifying done — race day coming up</div>
                    </div>
                  </>
                ) : selected.status === "racing" ? (
                  <>
                    <div className="relative">
                      <FlagTriangleRight size={18} className="text-[var(--color-primary)]" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--color-primary)]">Race in Progress</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">The race is live now</div>
                    </div>
                  </>
                ) : selected.status === "completed" ? (
                  <>
                    <Trophy size={18} className="text-[var(--color-green)]" />
                    <div>
                      <div className="text-sm font-bold text-[var(--color-green)]">Race Completed</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">Results and points have been calculated</div>
                    </div>
                  </>
                ) : selected.status === "cancelled" ? (
                  <>
                    <Ban size={18} className="text-[var(--color-text-secondary)]" />
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-secondary)]">Race Cancelled</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">This race has been cancelled</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock size={18} className="text-[var(--color-text-secondary)]" />
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-secondary)]">Upcoming</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">Predictions will open during race week</div>
                    </div>
                  </>
                )}
              </div>

              {/* Countdown for upcoming races */}
              {selected.status === "upcoming" && selected.qualifying_time && (
                <QualifyingCountdown qualifyingTime={selected.qualifying_time} />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        }
      `}</style>
    </>
  );
}
