"use client";
import { useEffect, useState } from "react";
import {
  Crosshair,
  CloudRain,
  ShieldAlert,
  AlertTriangle,
  Timer,
  Zap,
  CheckCircle2,
  Save,
  Minus,
  Plus,
  Clock,
  Tv,
  ArrowRight,
  Lock,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import RaceCalendar from "@/components/RaceCalendar";
import { supabase } from "@/lib/supabase";

interface Driver {
  code: string;
  name: string;
  team: string;
  origin?: string;
}

interface Race {
  id: string;
  name: string;
  race_time: string | null;
  qualifying_time: string | null;
  status: string;
}

const RACE_COUNTRY_CODES: Record<string, string> = {
  "Australian": "au", "Bahrain": "bh", "Saudi Arabian": "sa",
  "Japanese": "jp", "Chinese": "cn", "Miami": "us",
  "Emilia Romagna": "it", "Monaco": "mc", "Canadian": "ca",
  "Spanish": "es", "Austrian": "at", "British": "gb",
  "Hungarian": "hu", "Belgian": "be", "Dutch": "nl",
  "Italian": "it", "Azerbaijan": "az", "Singapore": "sg",
  "United States": "us", "Mexico City": "mx", "Mexican": "mx",
  "São Paulo": "br", "Brazil": "br",
  "Qatar": "qa", "Abu Dhabi": "ae", "Portuguese": "pt",
  "Turkish": "tr", "Russian": "ru", "Barcelona": "es",
};

function getRaceCountryCode(name: string): string | null {
  for (const [key, code] of Object.entries(RACE_COUNTRY_CODES)) {
    if (name.includes(key)) return code;
  }
  return null;
}

export default function PredictionsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [, setRaces] = useState<Race[]>([]);
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
  const [raceName, setRaceName] = useState("");
  const [raceStatus, setRaceStatus] = useState<string>("upcoming");
  const [raceId, setRaceId] = useState<string>("");
  const [, setQualifyingTime] = useState<string | null>(null);
  const [bestLap, setBestLap] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<{ position: number; icon_url: string | null; label: string | null }[]>([]);

  const qualiLocked = raceStatus !== "upcoming";
  const allLocked = raceStatus !== "upcoming";

  useEffect(() => {
    fetch("/api/prizes").then(r => r.json()).then(setPrizes).catch(() => {});
    fetch("/api/drivers").then(r => r.json()).then(setDrivers).catch(() => {});
    const loadRaces = () => fetch("/api/races").then(r => r.json()).then((data: Race[]) => {
      setRaces(data);
      const active = data.find(r => ["qualifying", "race_day"].includes(r.status));
      const upcoming = data.find(r => r.status === "upcoming");
      const defaultRace = active || upcoming || data[0];
      if (defaultRace && !selectedRaceId) setSelectedRaceId(defaultRace.id);
    }).catch(() => {});
    loadRaces();
    const interval = setInterval(loadRaces, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setRaceName(data.raceName || "");
        setRaceStatus(data.raceStatus || "upcoming");
        setQualifyingTime(data.qualifyingTime || null);
        setBestLap(data.bestLap || null);
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

  const getAvailable = (excludes: string[]) => drivers.filter(d => !excludes.includes(d.code));

  const buildData = () => ({
    race: { p1: raceP1, p2: raceP2, p3: raceP3 },
    qualifying: { p1: qualiP1, p2: qualiP2, p3: qualiP3 },
    conditions: { safetyCar, rain, dnfCount },
    poleTime: { minutes: poleMin, seconds: poleSec, milliseconds: poleMs },
  });

  const handleSave = async () => {
    if (allLocked) { setMessage("Predictions are locked"); setTimeout(() => setMessage(""), 3000); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ ...buildData(), raceId }),
    });
    if (res.ok) {
      setMessage("Predictions saved!");
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Failed to save");
    }
    setTimeout(() => setMessage(""), 3000);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold z-50 shadow-lg ${message.includes("submitted") || message.includes("saved") ? "bg-[var(--color-green)] text-black" : "bg-[var(--color-primary)] text-white"}`}>
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Crosshair size={20} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Race Predictions</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{raceName || "Loading..."}</p>
          </div>
        </div>
      </div>

      <Ticks />

      {/* Awards of the Weekend */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-[var(--color-gold)]" />
          <h2 className="text-xs font-extrabold tracking-[0.15em] uppercase">Awards of the Weekend</h2>
        </div>
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((pos) => {
              const prize = prizes.find(p => p.position === pos);
              const colors = ["var(--color-gold)", "var(--color-silver)", "var(--color-bronze)"];
              const titles = ["1st Place", "2nd Place", "3rd Place"];
              return (
                <div key={pos} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-md"
                    style={{ backgroundColor: colors[pos - 1] }}
                  >
                    {pos}
                  </div>
                  {prize?.icon_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prize.icon_url} alt={prize.label || ""} className="w-28 h-28 object-contain" />
                  )}
                  <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{titles[pos - 1]}</div>
                  <div className="text-sm font-semibold leading-snug">{prize?.label || "TBA"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Ticks />

      {/* Race Calendar */}
      <RaceCalendar onSelectRace={setSelectedRaceId} selectedRaceId={selectedRaceId} />

      <Ticks />

      {/* Selected race label */}
      <h2 className="text-lg font-extrabold flex items-center gap-2">
        Predictions for the {raceName || "..."}
        {raceName && getRaceCountryCode(raceName) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://hatscripts.github.io/circle-flags/flags/${getRaceCountryCode(raceName)}.svg`}
            alt=""
            className="w-7 h-7 shrink-0"
          />
        )}
      </h2>

      {/* Lock Banner */}
      {allLocked && raceStatus !== "upcoming" && (
        <div className="flex items-center gap-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl px-4 py-3">
          <Lock size={16} className="text-[var(--color-primary)]" />
          <span className="text-sm font-semibold text-[var(--color-primary)]">Predictions are locked — this race is no longer in upcoming status</span>
        </div>
      )}

      {/* Qualifying Predictions */}
      <div className={qualiLocked ? "opacity-50 pointer-events-none" : ""}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card
        icon={<Timer size={16} className={qualiLocked ? "text-[var(--color-text-secondary)]" : "text-[var(--color-primary)]"} />}
        title={qualiLocked ? "Qualifying Top 3 — Locked" : "Qualifying Top 3 — Saturday"}
        subtitle={qualiLocked ? "Qualifying predictions have been locked" : "Predict the qualifying order"}
      >
        <div className="space-y-3">
          <DriverPicker label="P1" badge="1" value={qualiP1} onChange={setQualiP1} drivers={getAvailable([qualiP2, qualiP3])} color="var(--color-gold)" />
          <DriverPicker label="P2" badge="2" value={qualiP2} onChange={setQualiP2} drivers={getAvailable([qualiP1, qualiP3])} color="var(--color-silver)" />
          <DriverPicker label="P3" badge="3" value={qualiP3} onChange={setQualiP3} drivers={getAvailable([qualiP1, qualiP2])} color="var(--color-bronze)" />
        </div>
      </Card>

      {/* Pole Time */}
      <Card
        icon={<Clock size={16} className={qualiLocked ? "text-[var(--color-text-secondary)]" : "text-[var(--color-primary)]"} />}
        title={qualiLocked ? "Pole Position Time — Locked" : "Pole Position Time"}
        subtitle={qualiLocked ? "Pole time prediction has been locked" : "Predict the fastest qualifying lap"}
      >
        <div className="flex items-center gap-2">
          <TimeInput placeholder="MM" value={poleMin} onChange={setPoleMin} maxLength={2} />
          <span className="text-lg font-bold text-[var(--color-text-secondary)]">:</span>
          <TimeInput placeholder="SS" value={poleSec} onChange={setPoleSec} maxLength={2} />
          <span className="text-lg font-bold text-[var(--color-text-secondary)]">.</span>
          <TimeInput placeholder="mmm" value={poleMs} onChange={setPoleMs} maxLength={3} width="w-16" />
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-[var(--color-text-secondary)]">Format: 01:25.000</span>
          {bestLap && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)]">Last Quali Time:</span>
              <span className="font-bold font-mono text-[var(--color-text)]">{bestLap}</span>
            </div>
          )}
        </div>
      </Card>
      </div>
      </div>

      <Ticks />

      {/* Race Predictions */}
      <div className={allLocked ? "opacity-50 pointer-events-none" : ""}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card
        icon={<Crosshair size={16} className="text-[var(--color-primary)]" />}
        title="Podium Finish — Sunday"
        subtitle="Predict the top 3 race finishers"
      >
        <div className="space-y-3">
          <DriverPicker label="P1" badge="1" value={raceP1} onChange={setRaceP1} drivers={getAvailable([raceP2, raceP3])} color="var(--color-gold)" />
          <DriverPicker label="P2" badge="2" value={raceP2} onChange={setRaceP2} drivers={getAvailable([raceP1, raceP3])} color="var(--color-silver)" />
          <DriverPicker label="P3" badge="3" value={raceP3} onChange={setRaceP3} drivers={getAvailable([raceP1, raceP2])} color="var(--color-bronze)" />
        </div>
      </Card>

      {/* Race Conditions */}
      <Card
        icon={<CloudRain size={16} className="text-[var(--color-primary)]" />}
        title="Race Conditions"
        subtitle="Predict the race day conditions"
      >
        <div className="space-y-0 divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm font-semibold">Safety Car</span>
            </div>
            <Toggle value={safetyCar} onChange={setSafetyCar} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CloudRain size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm font-semibold">Rain</span>
            </div>
            <Toggle value={rain} onChange={setRain} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm font-semibold">Number of DNFs</span>
            </div>
            <Stepper value={dnfCount} onChange={setDnfCount} min={0} max={22} />
          </div>
        </div>
      </Card>
      </div>
      </div>

      <Ticks />

      {/* Boost Promotions */}
      <div className="space-y-4">
        <h2 className="text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2">
          <Zap size={14} className="text-[var(--color-primary)]" />
          Boost Your Prediction
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Raiffeisen Boost Promo */}
        <Link href="/profile" className="group bg-[#FFDD00] rounded-2xl p-5 hover:shadow-lg hover:shadow-[#FFDD00]/20 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src="/raiffeisen-logo.png" alt="Raiffeisen" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-black">Raiffeisen Boost</h3>
                <span className="bg-black text-[#FFDD00] text-[10px] font-extrabold px-2 py-0.5 rounded-md">+15 PTS</span>
              </div>
              <p className="text-xs text-black/70">Link your Raiffeisen card in your profile to earn bonus points.</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-black/80 group-hover:text-black transition-colors">
                Go to Profile <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </Link>

        {/* DigitAlb 2× Promo */}
        <Link href="/profile" className="group bg-[var(--color-primary)] rounded-2xl p-5 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src="/digitalb-logo.webp" alt="DigitAlb" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-white">DigitAlb</h3>
                <span className="bg-white text-[var(--color-primary)] text-[10px] font-extrabold px-2 py-0.5 rounded-md">2× MULTIPLIER</span>
              </div>
              <p className="text-xs text-white/80">Add your subscriber ID in your profile to double your points — usable in 3 races per season.</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                Go to Profile <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </Link>
        </div>
      </div>

      {/* Save */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={allLocked}
          className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all ${allLocked ? "bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed" : "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20"}`}
        >
          {allLocked ? <Lock size={16} /> : <Save size={16} />}
          {allLocked ? "PREDICTIONS LOCKED" : "SAVE PREDICTIONS"}
        </button>
        {!allLocked && <p className="text-xs text-[var(--color-text-secondary)] text-center mt-2">Your predictions are auto-submitted and can be changed anytime before the deadline.</p>}
      </div>

    </div>
  );
}

/* ── Reusable components ── */

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-[var(--color-text-secondary)] mb-4 pl-[26px]">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function DriverPicker({ label, badge, value, onChange, drivers, color }: {
  label: string; badge: string; value: string; onChange: (v: string) => void; drivers: Driver[]; color: string;
}) {
  const options = drivers.map(d => ({
    value: d.code,
    label: `${d.name} (${d.code}) — ${d.team}`,
    icon: d.origin ? `https://hatscripts.github.io/circle-flags/flags/${d.origin.toLowerCase()}.svg` : undefined,
  }));
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm" style={{ backgroundColor: color }}>
        {badge}
      </div>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={`Select ${label} driver`}
        className="flex-1"
      />
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
      <button onClick={() => onChange(true)} className={`px-4 py-2 text-xs font-bold transition-all ${value ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"}`}>Yes</button>
      <button onClick={() => onChange(false)} className={`px-4 py-2 text-xs font-bold transition-all ${!value ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"}`}>No</button>
    </div>
  );
}

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors">
        <Minus size={14} />
      </button>
      <span className="text-base font-extrabold font-mono w-6 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );
}

function TimeInput({ placeholder, value, onChange, maxLength, width = "w-14" }: { placeholder: string; value: string; onChange: (v: string) => void; maxLength: number; width?: string }) {
  return (
    <input
      type="text"
      maxLength={maxLength}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
      className={`${width} text-center font-bold font-mono text-lg border border-[var(--color-border)] rounded-xl bg-[var(--color-background)] py-2.5 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors`}
    />
  );
}

function Ticks() {
  return (
    <div className="flex gap-[3px] items-end h-4">
      {[8, 5, 14, 8, 5, 14, 8, 5, 14, 8, 5, 14, 8, 5, 14].map((h, i) => (
        <div key={i} className="w-[3px] rounded-sm" style={{ height: h, backgroundColor: i % 3 === 2 ? "var(--color-primary)" : "var(--color-border)" }} />
      ))}
    </div>
  );
}
