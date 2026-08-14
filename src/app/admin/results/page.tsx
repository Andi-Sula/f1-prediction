"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  Timer,
  CloudRain,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Rocket,
  CheckCircle2,
  Minus,
  Plus,
  Info,
} from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

interface Driver { code: string; name: string; team: string; }

interface ScoreBreakdown {
  userId: string;
  username: string;
  score: {
    qualifying: { points: number; max: number };
    poleTime: { points: number; max: number };
    race: { points: number; max: number };
    conditions: { points: number; max: number };
    baseScore: number;
    raiffeisenBoost: number;
    digitAlbMultiplier: number;
    finalScore: number;
  };
}

interface Race { id: string; name: string; date: string; race_time: string | null; qualifying_time: string | null; status: string; results_published: boolean; }

export default function ResultsPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [raceP1, setRaceP1] = useState("");
  const [raceP2, setRaceP2] = useState("");
  const [raceP3, setRaceP3] = useState("");
  const [qualiP1, setQualiP1] = useState("");
  const [qualiP2, setQualiP2] = useState("");
  const [qualiP3, setQualiP3] = useState("");
  const [safetyCar, setSafetyCar] = useState(false);
  const [rain, setRain] = useState(false);
  const [dnfCount, setDnfCount] = useState(0);
  const [poleMin, setPoleMin] = useState("");
  const [poleSec, setPoleSec] = useState("");
  const [poleMs, setPoleMs] = useState("");
  const [message, setMessage] = useState("");
  const [publishedScores, setPublishedScores] = useState<ScoreBreakdown[]>([]);

  const selectedRaceData = races.find(r => r.id === selectedRace);
  const hasResults = selectedRaceData?.results_published ?? false;

  useEffect(() => {
    fetch("/api/drivers").then(r => r.json()).then(setDrivers).catch(() => {});
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/admin/races", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.races) {
          setRaces(json.races);
          // Auto-select the first active/in-progress race that hasn't had results published yet
          const active = json.races.find((r: Race) => r.status === "race_day" && !r.results_published)
            || json.races.find((r: Race) => r.status === "qualifying" && !r.results_published)
            || json.races.find((r: Race) => r.status !== "completed" && !r.results_published)
            || json.races[json.races.length - 1];
          if (active) {
            setSelectedRace(active.id);
          }
        }
      }
    })();
  }, []);

  // Load saved results when race selection changes
  useEffect(() => {
    if (!selectedRace) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(`/api/admin/results?raceId=${selectedRace}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.results) {
        const r = json.results;
        setRaceP1(r.race?.p1 || "");
        setRaceP2(r.race?.p2 || "");
        setRaceP3(r.race?.p3 || "");
        setQualiP1(r.qualifying?.p1 || "");
        setQualiP2(r.qualifying?.p2 || "");
        setQualiP3(r.qualifying?.p3 || "");
        setSafetyCar(r.conditions?.safetyCar ?? false);
        setRain(r.conditions?.rain ?? false);
        setDnfCount(r.conditions?.dnfCount ?? 0);
        setPoleMin(r.poleTime?.minutes || "");
        setPoleSec(r.poleTime?.seconds || "");
        setPoleMs(r.poleTime?.milliseconds || "");
      } else {
        setRaceP1(""); setRaceP2(""); setRaceP3("");
        setQualiP1(""); setQualiP2(""); setQualiP3("");
        setSafetyCar(false); setRain(false); setDnfCount(0);
        setPoleMin(""); setPoleSec(""); setPoleMs("");
      }
      setPublishedScores([]);
    })();
  }, [selectedRace]);

  const getAvailable = (excludes: string[]) => drivers.filter(d => !excludes.includes(d.code));

  const handlePublish = async () => {
    if (!raceP1 || !raceP2 || !raceP3) {
      setMessage("error:Please set all race podium positions.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!qualiP1 || !qualiP2 || !qualiP3) {
      setMessage("error:Please set all qualifying positions.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!poleMin || !poleSec) {
      setMessage("error:Please set the pole position time (at least minutes and seconds).");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const data = {
      raceId: selectedRace,
      results: { race: { p1: raceP1, p2: raceP2, p3: raceP3 }, qualifying: { p1: qualiP1, p2: qualiP2, p3: qualiP3 } },
      conditions: { safetyCar, rain, dnfCount },
      poleTime: { minutes: poleMin, seconds: poleSec, milliseconds: poleMs || "000" },
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage(`success:${result.message}`);
        setPublishedScores(result.scores || []);
      } else {
        setMessage(`error:${result.message || "Failed to publish results."}`);
      }
    } catch {
      setMessage("error:Failed to publish results.");
    }
    setTimeout(() => setMessage(""), 6000);
  };

  const msgType = message.split(":")[0];
  const msgText = message.split(":").slice(1).join(":");

  return (
    <div className="max-w-4xl space-y-6">
      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-6 flex items-center gap-2 px-4 py-3 rounded-sm text-sm font-semibold z-50 shadow-lg ${msgType === "success" ? "bg-[var(--color-green)] text-black" : "bg-[var(--color-primary)] text-white"}`}>
          <CheckCircle2 size={16} />
          {msgText}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Race Results & Conditions</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Set actual race outcomes to calculate user scores</p>
      </div>

      {/* Race Selector */}
      <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5">
        <label className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-2">Select Race</label>
        <CustomSelect
          value={selectedRace}
          onChange={setSelectedRace}
          options={races.map(r => {
            const formatted = r.qualifying_time ? new Date(r.qualifying_time).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
            return { value: r.id, label: `${r.name}${formatted ? ` — ${formatted}` : ""} (${r.status})${r.results_published ? " ✓ Results set" : ""}` };
          })}
          placeholder="Select race"
        />
        {hasResults && (
          <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-sm px-4 py-3">
            <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-amber-500">This race already has results published. Publishing again will recalculate all scores.</span>
          </div>
        )}
      </div>

      {/* Race Results */}
      <Section icon={<Trophy size={16} className="text-[var(--color-primary)]" />} title="Actual Race Results" subtitle="Set the real podium finishers">
        <div className="space-y-3">
          <DriverSelect label="P1 — Winner" value={raceP1} onChange={setRaceP1} drivers={getAvailable([raceP2, raceP3])} color="var(--color-gold)" />
          <DriverSelect label="P2 — Second" value={raceP2} onChange={setRaceP2} drivers={getAvailable([raceP1, raceP3])} color="var(--color-silver)" />
          <DriverSelect label="P3 — Third" value={raceP3} onChange={setRaceP3} drivers={getAvailable([raceP1, raceP2])} color="var(--color-bronze)" />
        </div>
      </Section>

      {/* Qualifying Results */}
      <Section icon={<Timer size={16} className="text-[var(--color-primary)]" />} title="Actual Qualifying Results" subtitle="Set the real qualifying top 3">
        <div className="space-y-3">
          <DriverSelect label="P1 — Pole" value={qualiP1} onChange={setQualiP1} drivers={getAvailable([qualiP2, qualiP3])} color="var(--color-gold)" />
          <DriverSelect label="P2" value={qualiP2} onChange={setQualiP2} drivers={getAvailable([qualiP1, qualiP3])} color="var(--color-silver)" />
          <DriverSelect label="P3" value={qualiP3} onChange={setQualiP3} drivers={getAvailable([qualiP1, qualiP2])} color="var(--color-bronze)" />
        </div>
      </Section>

      {/* Actual Conditions */}
      <Section icon={<CloudRain size={16} className="text-[var(--color-primary)]" />} title="Actual Race Conditions" subtitle="What actually happened during the race">
        <div className="divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm font-semibold">Safety Car Deployed?</span>
            </div>
            <Toggle value={safetyCar} onChange={setSafetyCar} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CloudRain size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm font-semibold">Rain During Race?</span>
            </div>
            <Toggle value={rain} onChange={setRain} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm font-semibold">Number of DNFs</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => setDnfCount(Math.max(0, dnfCount - 1))} className="w-8 h-8 rounded-sm border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors">
                <Minus size={14} />
              </button>
              <span className="text-base font-extrabold font-mono w-6 text-center">{dnfCount}</span>
              <button onClick={() => setDnfCount(Math.min(22, dnfCount + 1))} className="w-8 h-8 rounded-sm border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center hover:border-[var(--color-primary)] transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Actual Pole Time */}
      <Section icon={<Clock size={16} className="text-[var(--color-primary)]" />} title="Actual Pole Position Time" subtitle="Official pole lap time">
        <div className="flex items-center gap-2">
          <TimeInput placeholder="MM" value={poleMin} onChange={setPoleMin} maxLength={2} />
          <span className="text-lg font-bold text-[var(--color-text-secondary)]">:</span>
          <TimeInput placeholder="SS" value={poleSec} onChange={setPoleSec} maxLength={2} />
          <span className="text-lg font-bold text-[var(--color-text-secondary)]">:</span>
          <TimeInput placeholder="mmm" value={poleMs} onChange={setPoleMs} maxLength={3} width="w-16" />
        </div>
      </Section>

      {/* Publish */}
      <button onClick={handlePublish}
        className="w-full flex items-center justify-center gap-2.5 py-4 bg-[var(--color-primary)] text-white rounded-sm font-bold text-sm hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-all">
        <Rocket size={18} />
        PUBLISH RESULTS & CALCULATE POINTS
      </button>

      {/* Scoring Rules Reference */}
      <Section icon={<Info size={16} className="text-[var(--color-primary)]" />} title="Scoring Matrix (max 129 pts)" subtitle="Points are calculated automatically per the official regulations">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-[var(--color-background)] rounded-sm p-3">
            <div className="text-lg font-extrabold">24</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Qualifying</div>
          </div>
          <div className="bg-[var(--color-background)] rounded-sm p-3">
            <div className="text-lg font-extrabold">27</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Pole Time</div>
          </div>
          <div className="bg-[var(--color-background)] rounded-sm p-3">
            <div className="text-lg font-extrabold">58</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Race Podium</div>
          </div>
          <div className="bg-[var(--color-background)] rounded-sm p-3">
            <div className="text-lg font-extrabold">20</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Conditions</div>
          </div>
        </div>
      </Section>

      {/* Published Scores Breakdown */}
      {publishedScores.length > 0 && (
        <Section icon={<Trophy size={16} className="text-[var(--color-gold)]" />} title="Score Breakdown" subtitle={`${publishedScores.length} user(s) scored`}>
          <div className="space-y-3">
            {publishedScores.map((s) => (
              <div key={s.userId} className="bg-[var(--color-background)] rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm">@{s.username}</span>
                  <span className="text-lg font-extrabold text-[var(--color-primary)]">{s.score.finalScore} pts</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="font-extrabold">{s.score.qualifying.points}/{s.score.qualifying.max}</div>
                    <div className="text-[var(--color-text-secondary)]">Quali</div>
                  </div>
                  <div>
                    <div className="font-extrabold">{s.score.poleTime.points}/{s.score.poleTime.max}</div>
                    <div className="text-[var(--color-text-secondary)]">Pole</div>
                  </div>
                  <div>
                    <div className="font-extrabold">{s.score.race.points}/{s.score.race.max}</div>
                    <div className="text-[var(--color-text-secondary)]">Race</div>
                  </div>
                  <div>
                    <div className="font-extrabold">{s.score.conditions.points}/{s.score.conditions.max}</div>
                    <div className="text-[var(--color-text-secondary)]">Cond.</div>
                  </div>
                </div>
                {(s.score.raiffeisenBoost > 0 || s.score.digitAlbMultiplier > 1) && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--color-border)] text-xs">
                    {s.score.raiffeisenBoost > 0 && <span className="text-[#FFDD00] font-bold">+15 Raiffeisen</span>}
                    {s.score.digitAlbMultiplier > 1 && <span className="text-[var(--color-primary)] font-bold">2× DigitAlb</span>}
                    <span className="text-[var(--color-text-secondary)] ml-auto">Base: {s.score.baseScore}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ── Reusable ── */

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5">
      <div className="flex items-center gap-2 mb-1">{icon}<h3 className="font-bold text-sm">{title}</h3></div>
      <p className="text-xs text-[var(--color-text-secondary)] mb-4 pl-[26px]">{subtitle}</p>
      {children}
    </div>
  );
}

function DriverSelect({ label, value, onChange, drivers, color }: {
  label: string; value: string; onChange: (v: string) => void; drivers: Driver[]; color: string;
}) {
  const options = drivers.map(d => ({ value: d.code, label: `${d.name} (${d.code}) — ${d.team}` }));
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: color }}>
        <span className="text-white font-extrabold text-xs">{label.charAt(0)}</span>
      </div>
      <div className="flex-1">
        <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">{label}</label>
        <CustomSelect
          value={value}
          onChange={onChange}
          options={options}
          placeholder="Select driver"
        />
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded-sm border border-[var(--color-border)] overflow-hidden">
      <button onClick={() => onChange(true)} className={`px-4 py-2 text-xs font-bold transition-all ${value ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background)] text-[var(--color-text-secondary)]"}`}>Yes</button>
      <button onClick={() => onChange(false)} className={`px-4 py-2 text-xs font-bold transition-all ${!value ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background)] text-[var(--color-text-secondary)]"}`}>No</button>
    </div>
  );
}

function TimeInput({ placeholder, value, onChange, maxLength, width = "w-14" }: { placeholder: string; value: string; onChange: (v: string) => void; maxLength: number; width?: string }) {
  return (
    <input type="text" maxLength={maxLength} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
      className={`${width} text-center font-bold font-mono text-lg border border-[var(--color-border)] rounded-sm bg-[var(--color-background)] py-2.5 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors`} />
  );
}
