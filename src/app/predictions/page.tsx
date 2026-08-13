"use client";
import { useEffect, useRef, useState } from "react";
import { Lock, Save, CheckCircle2, Minus, Plus, Zap, Tv, ArrowRight } from "lucide-react";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import QualifyingCountdown from "@/components/QualifyingCountdown";
import { supabase } from "@/lib/supabase";

interface Driver { code: string; name: string; team: string; }
interface Race { id: string; name: string; round: number; qualifying_time: string | null; last_quali_time: string | null; status: string; }

const SECTIONS = [
  { id: "podium", label: "RACE PODIUM", icon: "🏆", pts: 58 },
  { id: "conditions", label: "RACE CONDITIONS", icon: "🌧️", pts: 20 },
  { id: "qualifying", label: "QUALIFYING POLE", icon: "⚡", pts: 51 },
] as const;

export default function PredictionsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [raceP1, setRaceP1] = useState("");
  const [raceP2, setRaceP2] = useState("");
  const [raceP3, setRaceP3] = useState("");
  const [qualiP1, setQualiP1] = useState("");
  const [qualiP2, setQualiP2] = useState("");
  const [qualiP3, setQualiP3] = useState("");
  const [safetyCar, setSafetyCar] = useState(true);
  const [rain, setRain] = useState(false);
  const [dnfCount, setDnfCount] = useState(0);
  const [poleMin, setPoleMin] = useState("");
  const [poleSec, setPoleSec] = useState("");
  const [poleMs, setPoleMs] = useState("");
  const [message, setMessage] = useState("");
  const [raceStatus, setRaceStatus] = useState("upcoming");
  const [raceId, setRaceId] = useState("");
  const [qualifyingTime, setQualifyingTime] = useState<string | null>(null);
  const [lastQualiTime, setLastQualiTime] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("podium");

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const minRef = useRef<HTMLInputElement | null>(null);
  const secRef = useRef<HTMLInputElement | null>(null);
  const msRef = useRef<HTMLInputElement | null>(null);
  const allLocked = raceStatus !== "upcoming";

  useEffect(() => {
    fetch("/api/drivers").then(r => r.json()).then(setDrivers).catch(() => {});
    fetch("/api/races").then(r => r.json()).then((data: Race[]) => {
      setRaces(data);
      const active = data.find(r => ["qualifying", "waiting_race", "racing"].includes(r.status));
      const upcoming = data.find(r => r.status === "upcoming");
      const defaultRace = active || upcoming || data[0];
      if (defaultRace) setSelectedRaceId(defaultRace.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRaceId) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;
      try {
        const res = await fetch(`/api/predictions?raceId=${selectedRaceId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setRaceId(data.raceId || "");
        setRaceStatus(data.raceStatus || "upcoming");
        setQualifyingTime(data.qualifyingTime || null);
        setLastQualiTime(data.lastQualiTime || null);
        const p = data.prediction;
        if (p) {
          if (p.race) { setRaceP1(p.race.p1 || ""); setRaceP2(p.race.p2 || ""); setRaceP3(p.race.p3 || ""); }
          else { setRaceP1(""); setRaceP2(""); setRaceP3(""); }
          if (p.qualifying) { setQualiP1(p.qualifying.p1 || ""); setQualiP2(p.qualifying.p2 || ""); setQualiP3(p.qualifying.p3 || ""); }
          else { setQualiP1(""); setQualiP2(""); setQualiP3(""); }
          if (p.conditions) { setSafetyCar(p.conditions.safetyCar ?? true); setRain(p.conditions.rain ?? false); setDnfCount(p.conditions.dnfCount ?? 0); }
          else { setSafetyCar(true); setRain(false); setDnfCount(0); }
          if (p.poleTime) { setPoleMin(p.poleTime.minutes || ""); setPoleSec(p.poleTime.seconds || ""); setPoleMs(p.poleTime.milliseconds || ""); }
          else { setPoleMin(""); setPoleSec(""); setPoleMs(""); }
        } else {
          setRaceP1(""); setRaceP2(""); setRaceP3("");
          setQualiP1(""); setQualiP2(""); setQualiP3("");
          setSafetyCar(true); setRain(false); setDnfCount(0);
          setPoleMin(""); setPoleSec(""); setPoleMs("");
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [selectedRaceId]);

  // Scroll-based section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { threshold: 0.2, rootMargin: "-100px 0px -50% 0px" },
    );
    SECTIONS.forEach(s => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [races, selectedRaceId]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getAvailable = (excludes: string[]) => drivers.filter(d => !excludes.includes(d.code));

  const handleSave = async () => {
    if (allLocked) { setMessage("Predictions are locked"); setTimeout(() => setMessage(""), 3000); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        race: { p1: raceP1, p2: raceP2, p3: raceP3 },
        qualifying: { p1: qualiP1, p2: qualiP2, p3: qualiP3 },
        conditions: { safetyCar, rain, dnfCount },
        poleTime: { minutes: poleMin, seconds: poleSec, milliseconds: poleMs },
        raceId,
      }),
    });
    if (res.ok) {
      setMessage("Predictions saved!");
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Failed to save");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const selectedRace = races.find(r => r.id === selectedRaceId);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-6 flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold z-50 shadow-lg ${
          message.includes("saved") ? "bg-[var(--color-green)] text-black" : "bg-[var(--color-primary)] text-white"
        }`}>
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {/* ── Header ── */}
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="text-[11px] font-extrabold tracking-[0.15em] text-[var(--color-primary)] mb-2">
            🏎️&ensp;{selectedRace ? `ROUND ${selectedRace.round} — ${selectedRace.name.replace(" Grand Prix", " GP").toUpperCase()}` : "SELECT A RACE"}
          </div>

          <div className="flex items-start justify-between mb-6">
            <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-text)] tracking-tight">MAKE YOUR PICKS</h1>
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-wider">POTENTIAL SCORE</div>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black text-[var(--color-primary)]">0</span>
                <span className="text-lg font-bold text-[var(--color-text-secondary)]">/ 129</span>
              </div>
              <div className="h-[2px] bg-[var(--color-primary)] rounded-full mt-1" />
            </div>
          </div>

          <CustomSelect
            value={selectedRaceId}
            onChange={setSelectedRaceId}
            options={races.map(r => ({
              value: r.id,
              label: `${r.name}${r.qualifying_time ? ` — ${new Date(r.qualifying_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""} (${r.status})`,
            }))}
            placeholder="Select race"
          />

          {raceStatus === "upcoming" && qualifyingTime && (
            <div className="mt-4"><QualifyingCountdown qualifyingTime={qualifyingTime} /></div>
          )}

          {allLocked && raceStatus !== "upcoming" && (
            <div className="flex items-center gap-3 mt-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded px-4 py-3">
              <Lock size={16} className="text-[var(--color-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-primary)]">Predictions are locked — this race is no longer in upcoming status</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex">
          {/* Sidebar — desktop */}
          <aside className="hidden md:block w-64 shrink-0 pt-8 pr-6 border-r border-[var(--color-border)]">
            <div className="sticky top-20">
              <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] mb-3">SELECT GAME</div>
              <nav className="space-y-1">
                {SECTIONS.map(s => {
                  const active = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-4 py-3.5 rounded flex items-center gap-3 transition-all relative ${
                        active ? "bg-[var(--color-surface)]" : "hover:bg-[var(--color-surface)]/50"
                      }`}
                    >
                      {active && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--color-primary)]" />}
                      <span className="text-lg">{s.icon}</span>
                      <div>
                        <div className={`text-[13px] font-extrabold tracking-wide ${active ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"}`}>
                          {s.label}
                        </div>
                        <div className={`text-[10px] font-bold ${active ? "text-[var(--color-primary)]" : "text-[var(--color-primary)]/50"}`}>
                          UP TO {s.pts} PTS
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content column */}
          <div className="flex-1 md:pl-8">
            {/* Mobile tabs — sticky */}
            <div className="md:hidden sticky top-14 z-30 bg-[var(--color-background)] border-b border-[var(--color-border)] -mx-4 px-4 flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
              {SECTIONS.map(s => {
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`shrink-0 px-4 py-2.5 rounded text-[11px] font-extrabold flex items-center gap-2 transition-all border ${
                      active
                        ? "bg-[var(--color-surface)] border-[var(--color-primary)]/30 text-[var(--color-text)]"
                        : "border-transparent text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <span>{s.icon}</span>{s.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 md:pt-8">
            <div className={`space-y-16 ${allLocked ? "opacity-50 pointer-events-none" : ""}`}>
              {/* ─ Race Podium ─ */}
              <section id="podium" ref={el => { sectionRefs.current.podium = el; }}>
                <SectionHeader icon="🏆" title="RACE PODIUM" desc="Predict the top 3 race finishers on Sunday" pts={58} />
                <div className="mt-6 space-y-4">
                  <DriverPicker label="P1 — Winner" badge="1" value={raceP1} onChange={setRaceP1} drivers={getAvailable([raceP2, raceP3])} color="#FFD700" />
                  <DriverPicker label="P2 — Second" badge="2" value={raceP2} onChange={setRaceP2} drivers={getAvailable([raceP1, raceP3])} color="#C0C0C0" />
                  <DriverPicker label="P3 — Third" badge="3" value={raceP3} onChange={setRaceP3} drivers={getAvailable([raceP1, raceP2])} color="#CD7F32" />
                </div>
                <ScoringBox rules={[
                  "P1 correct position: 25 pts — in top 3: 10 pts",
                  "P2 correct position: 18 pts — in top 3: 8 pts",
                  "P3 correct position: 15 pts — in top 3: 6 pts",
                ]} />
              </section>

              {/* ─ Race Conditions ─ */}
              <section id="conditions" ref={el => { sectionRefs.current.conditions = el; }}>
                <SectionHeader icon="🌧️" title="RACE CONDITIONS" desc="Predict safety car, rain and DNFs" pts={20} />
                <div className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded divide-y divide-[var(--color-border)] overflow-hidden">
                  <ConditionRow label="Safety Car"><YesNo value={safetyCar} onChange={setSafetyCar} /></ConditionRow>
                  <ConditionRow label="Rain"><YesNo value={rain} onChange={setRain} /></ConditionRow>
                  <ConditionRow label="Number of DNFs"><Stepper value={dnfCount} onChange={setDnfCount} min={0} max={22} /></ConditionRow>
                </div>
                <ScoringBox rules={[
                  "Correct Safety Car prediction: 5 pts",
                  "Correct Rain prediction: 5 pts",
                  "Exact DNF count: 10 pts — ±1 off: 5 pts — ±2 off: 2 pts",
                ]} />
              </section>

              {/* ─ Qualifying Pole Position ─ */}
              <section id="qualifying" ref={el => { sectionRefs.current.qualifying = el; }}>
                <SectionHeader icon="⚡" title="QUALIFYING POLE POSITION" desc="Predict qualifying top 3 and the fastest lap time" pts={51} />
                <div className="mt-6 space-y-4">
                  <DriverPicker label="P1 — Pole" badge="1" value={qualiP1} onChange={setQualiP1} drivers={getAvailable([qualiP2, qualiP3])} color="#FFD700" />
                  <DriverPicker label="P2 — Second" badge="2" value={qualiP2} onChange={setQualiP2} drivers={getAvailable([qualiP1, qualiP3])} color="#C0C0C0" />
                  <DriverPicker label="P3 — Third" badge="3" value={qualiP3} onChange={setQualiP3} drivers={getAvailable([qualiP1, qualiP2])} color="#CD7F32" />
                </div>
                <div className="mt-8">
                  <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.12em] mb-3">BEST LAP TIME PREDICTION</div>
                  <div className="flex items-center gap-2">
                    <TimeInput placeholder="MM" value={poleMin} onChange={setPoleMin} maxLength={2} nextRef={secRef} inputRef={minRef} />
                    <span className="text-lg font-bold text-[var(--color-text-secondary)]">:</span>
                    <TimeInput placeholder="SS" value={poleSec} onChange={setPoleSec} maxLength={2} nextRef={msRef} inputRef={secRef} />
                    <span className="text-lg font-bold text-[var(--color-text-secondary)]">.</span>
                    <TimeInput placeholder="mmm" value={poleMs} onChange={setPoleMs} maxLength={3} width="w-16" inputRef={msRef} />
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                    {lastQualiTime
                      ? <span>Last year pole: <span className="font-mono font-bold text-[var(--color-primary)]">{lastQualiTime}</span></span>
                      : "Format: 01:25.000"}
                  </div>
                </div>
                <ScoringBox rules={[
                  "P1 correct position: 10 pts — in top 3: 5 pts",
                  "P2 correct position: 8 pts — in top 3: 4 pts",
                  "P3 correct position: 6 pts — in top 3: 3 pts",
                  "Pole time MM:SS match: 2 pts — +tenths: +5 — +hundredths: +5 — +thousandths: +15",
                ]} />
              </section>
            </div>

            {/* Boost Promotions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <Link href="/profile" className="group bg-[#FFDD00] rounded p-5 hover:shadow-lg hover:shadow-[#FFDD00]/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-sm bg-black/10 flex items-center justify-center shrink-0">
                    <Zap size={20} className="text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-black">Raiffeisen Boost</h3>
                      <span className="bg-black text-[#FFDD00] text-[10px] font-extrabold px-2 py-0.5 rounded-sm">+15 PTS</span>
                    </div>
                    <p className="text-xs text-black/70">Link your Raiffeisen card in your profile to earn bonus points.</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-bold text-black/80 group-hover:text-black transition-colors">
                      Go to Profile <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/profile" className="group bg-[var(--color-primary)] rounded p-5 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center shrink-0">
                    <Tv size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-white">DigitAlb 2× Points</h3>
                      <span className="bg-white text-[var(--color-primary)] text-[10px] font-extrabold px-2 py-0.5 rounded-sm">2×</span>
                    </div>
                    <p className="text-xs text-white/80">Add your subscriber ID in your profile to double your points.</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                      Go to Profile <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Save */}
            <div className="mt-12">
              <button
                onClick={handleSave}
                disabled={allLocked}
                className={`w-full flex items-center justify-center gap-2.5 py-4 rounded font-extrabold text-sm tracking-wider transition-all ${
                  allLocked
                    ? "bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed"
                    : "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20"
                }`}
              >
                {allLocked ? <Lock size={16} /> : <Save size={16} />}
                {allLocked ? "PREDICTIONS LOCKED" : "SAVE PREDICTIONS"}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SectionHeader({ icon, title, desc, pts }: { icon: string; title: string; desc: string; pts: number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">{title}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{desc}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-3xl font-black text-[var(--color-primary)]">{pts}</div>
        <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-wider">MAX PTS</div>
      </div>
    </div>
  );
}

function ScoringBox({ rules }: { rules: string[] }) {
  return (
    <div className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4">
      <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.12em] mb-3">SCORING RULES</div>
      <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
        {rules.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[var(--color-primary)] shrink-0">→</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverPicker({ label, badge, value, onChange, drivers, color }: {
  label: string; badge: string; value: string; onChange: (v: string) => void; drivers: Driver[]; color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0" style={{ backgroundColor: color }}>
        {badge}
      </div>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={drivers.map(d => ({ value: d.code, label: `${d.name} (${d.code}) — ${d.team}` }))}
        placeholder={`Select ${label}`}
        className="flex-1"
      />
    </div>
  );
}

function ConditionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm font-bold">{label}</span>
      {children}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded overflow-hidden border border-[var(--color-border)]">
      <button
        onClick={() => onChange(true)}
        className={`px-5 py-2 text-xs font-extrabold tracking-wider transition-all ${
          value ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        }`}
      >YES</button>
      <button
        onClick={() => onChange(false)}
        className={`px-5 py-2 text-xs font-extrabold tracking-wider transition-all ${
          !value ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        }`}
      >NO</button>
    </div>
  );
}

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-sm border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors">
        <Minus size={14} />
      </button>
      <span className="text-base font-extrabold font-mono w-6 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-sm border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );
}

function TimeInput({ placeholder, value, onChange, maxLength, width = "w-14", nextRef, inputRef }: {
  placeholder: string; value: string; onChange: (v: string) => void; maxLength: number; width?: string;
  nextRef?: React.RefObject<HTMLInputElement | null>; inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      maxLength={maxLength}
      placeholder={placeholder}
      value={value}
      onChange={e => {
        const val = e.target.value.replace(/\D/g, "");
        onChange(val);
        if (val.length >= maxLength && nextRef?.current) {
          nextRef.current.focus();
        }
      }}
      className={`${width} text-center font-bold font-mono text-lg border border-[var(--color-border)] rounded bg-[var(--color-background)] py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors`}
    />
  );
}
