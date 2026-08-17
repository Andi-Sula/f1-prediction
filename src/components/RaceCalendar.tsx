"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import QualifyingCountdown from "./QualifyingCountdown";

interface Race {
  id: string;
  name: string;
  date: string;
  qualifying_time: string | null;
  status: "completed" | "active" | "upcoming" | "qualifying" | "waiting_race" | "racing" | "race_day" | "cancelled";
}

interface RaceCalendarProps {
  onSelectRace?: (raceId: string) => void;
  selectedRaceId?: string;
}

export default function RaceCalendar({ onSelectRace, selectedRaceId }: RaceCalendarProps = {}) {
  const [races, setRaces] = useState<Race[]>([]);
  const [selected, setSelected] = useState<Race | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => fetch("/api/races").then(r => r.json()).then(setRaces).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!races.length || !scrollRef.current) return;
    let idx = races.findIndex(r => ["active", "qualifying", "waiting_race", "racing", "race_day"].includes(r.status));
    if (idx < 0) idx = races.findIndex(r => r.status === "upcoming");
    if (idx < 0) return;
    const el = scrollRef.current.children[idx] as HTMLElement;
    if (el) scrollRef.current.scrollTo({ left: el.offsetLeft - scrollRef.current.offsetWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
  }, [races]);

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  const shortName = (name: string) => name.replace(" Grand Prix", " GP");
  const fmtDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };
  const fmtDateSpan = (race: Race) => {
    if (!race.date) return "TBD";
    const raceDate = new Date(race.date + "T00:00:00");
    if (!race.qualifying_time) return fmtDate(race.date);
    const qualiDate = new Date(race.qualifying_time);
    const qualiDay = qualiDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const raceDay = raceDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    if (qualiDate.toDateString() === raceDate.toDateString()) return raceDay;
    if (qualiDate.getMonth() === raceDate.getMonth()) {
      return `${qualiDate.toLocaleDateString("en-US", { month: "short" })} ${qualiDate.getDate()}-${raceDate.getDate()}`;
    }
    return `${qualiDay} - ${raceDay}`;
  };

  const completed = races.filter(r => r.status === "completed" || r.status === "cancelled").length;
  const hasActive = races.some(r => ["qualifying", "waiting_race", "racing", "race_day"].includes(r.status));
  const nextUpcoming = races.find(r => r.status === "upcoming" && r.qualifying_time);

  return (
    <>
      <div className="relative">
        {/* Countdown - above calendar */}
        {!hasActive && nextUpcoming && (
          <div className="flex justify-end mb-2">
            <QualifyingCountdown qualifyingTime={nextUpcoming.qualifying_time!} compact />
          </div>
        )}

        {/* Scroll buttons */}
        <button onClick={() => scroll(-1)} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors shadow-sm hidden sm:flex">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => scroll(1)} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors shadow-sm hidden sm:flex">
          <ChevronRight size={14} />
        </button>

        {/* Race cards */}
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
{races.map((race, idx) => {
            const today = new Date().toISOString().split("T")[0];
            const isRaceDay = race.status === "race_day" || (race.date === today && race.status === "qualifying");
            const isDone = race.status === "completed";
            const isLive = race.status === "racing" || isRaceDay;
            const isRaceWeek = !isRaceDay && (race.status === "qualifying" || race.status === "waiting_race");
            const isCancelled = race.status === "cancelled";
            const isUpcoming = race.status === "upcoming";
            const isNext = !hasActive && race.id === races.find(r => r.status === "upcoming")?.id;

            return (
              <button
                key={race.id}
                onClick={() => onSelectRace ? onSelectRace(race.id) : setSelected(race)}
                className={`shrink-0 w-[120px] rounded-xl p-3 text-left transition-all duration-200 border-2 ${
                  selectedRaceId === race.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md"
                    : isLive
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 shadow-sm"
                    : isRaceWeek
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 shadow-sm"
                    : isNext
                    ? "border-amber-300 bg-amber-50 shadow-sm"
                    : isDone
                    ? "border-transparent bg-[var(--color-background)] opacity-70"
                    : isCancelled
                    ? "border-transparent bg-[var(--color-background)] opacity-40"
                    : "border-transparent bg-white hover:border-[var(--color-border)]"
                }`}
              >
                {/* Flag + Round */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${
                    isLive ? "text-[var(--color-primary)]" : isRaceWeek ? "text-[var(--color-primary)]" : isNext ? "text-amber-600" : "text-[var(--color-text-secondary)]"
                  }`}>R{idx + 1}</span>
                </div>

                {/* Name */}
                <div className={`text-[11px] font-bold leading-tight mb-1 ${
                  isCancelled ? "line-through text-[var(--color-text-secondary)]" : "text-[var(--color-text)]"
                }`}>
                  {shortName(race.name)}
                </div>

                {/* Date */}
                <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">
                  {fmtDateSpan(race)}
                </div>

                {/* Status tag */}
                {isLive && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                    <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase">Live</span>
                  </div>
                )}
                {isRaceWeek && (
                  <div className="text-[9px] font-bold text-[var(--color-primary)] uppercase">
                    {race.status === "qualifying" ? "Qualifying" : "Race Week"}
                  </div>
                )}
                {isUpcoming && (
                  <div className={`text-[9px] font-bold uppercase ${isNext ? "text-amber-600" : "text-[var(--color-green)]"}`}>
                    {isNext ? "Next Up" : "Open"}
                  </div>
                )}
                {isDone && (
                  <div className="text-[9px] font-bold text-[var(--color-green)]/70 uppercase">Done</div>
                )}
                {isCancelled && (
                  <div className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Cancelled</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${(completed / Math.max(races.length, 1)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
            {completed}/{races.length}
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] animate-[fadeIn_0.15s_ease-out]" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-bold text-base">{selected.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">{fmtDate(selected.date)}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--color-background)] rounded-lg p-3">
                  <div className="text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Race Day</div>
                  <div className="text-sm font-bold">{selected.date ? fmtDate(selected.date) : "TBD"}</div>
                  {selected.qualifying_time && (
                    <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      Quali: {new Date(selected.qualifying_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                <div className="bg-[var(--color-background)] rounded-lg p-3">
                  <div className="text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Status</div>
                  <div className={`text-sm font-bold ${
                    selected.status === "racing" ? "text-[var(--color-primary)]" :
                    ["qualifying", "waiting_race"].includes(selected.status) ? "text-amber-600" :
                    selected.status === "completed" ? "text-[var(--color-green)]" :
                    "text-[var(--color-text)]"
                  }`}>
                    {selected.status === "qualifying" ? "Qualifying" :
                     selected.status === "waiting_race" ? "Race Week" :
                     selected.status === "racing" ? "Live" :
                     selected.status === "completed" ? "Completed" :
                     selected.status === "cancelled" ? "Cancelled" : "Upcoming"}
                  </div>
                </div>
              </div>

              {/* Countdown for upcoming */}
              {selected.status === "upcoming" && selected.qualifying_time && (
                <QualifyingCountdown qualifyingTime={selected.qualifying_time} />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
