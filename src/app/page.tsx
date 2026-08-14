export const dynamic = "force-dynamic";

import Link from "next/link";
import { Trophy } from "lucide-react";
import RaceCalendar from "@/components/RaceCalendar";
import HomeHero from "@/components/HomeHero";
import { supabaseAdmin } from "@/lib/supabase-server";

const positionColors = ["var(--color-gold)", "var(--color-silver)", "var(--color-bronze)"];

const GAME_MODES = [
  { emoji: "🏆", difficulty: "HARD", title: "RACE PODIUM", desc: "Predict the top 3 race finishers on Sunday in exact order.", pts: "UP TO 58 PTS", section: "podium" },
  { emoji: "🌧️", difficulty: "EASY", title: "RACE CONDITIONS", desc: "Predict safety car deployment, rain and number of DNFs.", pts: "UP TO 20 PTS", section: "conditions" },
  { emoji: "⚡", difficulty: "MEDIUM", title: "QUALIFYING POLE", desc: "Predict qualifying top 3 and the fastest pole lap time.", pts: "UP TO 51 PTS", section: "qualifying" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "CHOOSE YOUR PICKS", desc: "Make predictions for race podium, conditions and qualifying pole for each race weekend." },
  { step: "02", title: "SUBMIT BEFORE DEADLINE", desc: "All predictions lock when qualifying starts. Submit your picks before the deadline." },
  { step: "03", title: "SCORE WHEN RACE ENDS", desc: "Points are calculated automatically as soon as official F1 results are confirmed." },
  { step: "04", title: "WIN MERCHANDISE", desc: "Round winners and season leaders win official F1 gear. Top 3 monthly scorers get race jackets." },
];

async function getPrizes() {
  try {
    const { data, error } = await supabaseAdmin
      .from("prizes")
      .select("position, published_icon_url, published_label")
      .eq("active", true)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data || []).map((p) => ({
      position: p.position,
      icon_url: p.published_icon_url,
      label: p.published_label,
    }));
  } catch { return []; }
}

async function getTopPredictors() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username, name, surname, points")
      .eq("status", "active")
      .neq("role", "admin")
      .order("points", { ascending: false })
      .limit(5);
    if (error) throw error;

    // Count actual predictions from user_race_scores
    const userIds = (data || []).map((u) => u.id);
    const { data: scores } = await supabaseAdmin
      .from("user_race_scores")
      .select("user_id")
      .in("user_id", userIds);

    const predictionCounts: Record<string, number> = {};
    for (const s of scores || []) {
      predictionCounts[s.user_id] = (predictionCounts[s.user_id] || 0) + 1;
    }

    return (data || []).map((u, i) => ({
      rank: i + 1,
      username: u.username,
      initials: ((u.name || "")[0] + (u.surname || "")[0]).toUpperCase(),
      points: u.points || 0,
      predictions: predictionCounts[u.id] || 0,
    }));
  } catch { return []; }
}

export default async function HomePage() {
  const [prizes, topPredictors] = await Promise.all([
    getPrizes() as Promise<Array<{ position: number; icon_url: string; label: string }>>,
    getTopPredictors(),
  ]);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Hero — full bleed */}
      <HomeHero />

      {/* Prediction Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] uppercase">PREDICTION GAMES</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">3 WAYS TO WIN</h2>
          </div>
          <Link href="/predictions" className="text-[11px] font-extrabold text-[var(--color-primary)] tracking-[0.1em] hover:underline">
            ALL GAMES →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_MODES.map((g) => (
            <Link key={g.title} href={`/predictions#${g.section}`}
              className="group bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{g.emoji}</span>
                <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded ${
                  g.difficulty === "EASY" ? "bg-[var(--color-green)]/10 text-[var(--color-green)]"
                  : g.difficulty === "HARD" ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                }`}>
                  {g.difficulty}
                </span>
              </div>
              <h3 className="text-sm font-extrabold tracking-wide">{g.title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">{g.desc}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-border)]">
                <span className="text-[10px] font-extrabold text-[var(--color-primary)]">{g.pts}</span>
                <span className="text-[10px] font-extrabold text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">PREDICT →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Season Calendar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] uppercase mb-4">SEASON</div>
        <RaceCalendar />
      </section>

      {/* Top Predictors + Awards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Predictors */}
          <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] uppercase">SEASON STANDINGS</div>
              <h3 className="text-lg font-extrabold mt-0.5">TOP PREDICTORS</h3>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {topPredictors.map((p) => (
                <Link key={p.rank} href="/leaderboard" className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-border)]/20 transition-colors">
                  <span className="text-sm font-extrabold shrink-0 w-5" style={{ color: p.rank <= 3 ? positionColors[p.rank - 1] : 'var(--color-text-secondary)' }}>
                    {p.rank}
                  </span>
                  <div className="w-8 h-8 rounded-sm bg-[var(--color-border)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)] shrink-0">
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{p.username}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">{p.predictions} predictions</div>
                  </div>
                  <span className="text-sm font-extrabold font-mono">{p.points}</span>
                </Link>
              ))}
              {topPredictors.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] p-5">No data yet</p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-[var(--color-border)]">
              <Link href="/leaderboard" className="text-[11px] font-extrabold text-[var(--color-primary)] tracking-[0.1em] hover:underline">
                FULL LEADERBOARD →
              </Link>
            </div>
          </div>

          {/* Awards */}
          <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] uppercase">PRIZES</div>
              <h3 className="text-lg font-extrabold mt-0.5">AWARDS OF THE WEEKEND</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((pos) => {
                  const prize = prizes.find((p: { position: number }) => p.position === pos);
                  return (
                    <div key={pos} className="flex flex-col items-center gap-2 text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg" style={{ backgroundColor: positionColors[pos - 1] }}>
                        {pos}
                      </div>
                      {prize?.icon_url && (
                        <img src={prize.icon_url} alt={prize.label} className="w-10 h-10 object-contain" />
                      )}
                      <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-widest">
                        {pos === 1 ? "1ST PLACE" : pos === 2 ? "2ND PLACE" : "3RD PLACE"}
                      </div>
                      <div className="text-xs font-bold leading-snug">{prize?.label || "TBA"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-14 mb-10">
        <div className="mb-6">
          <div className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] uppercase">THE RULES</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">HOW IT WORKS</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5">
              <span className="text-3xl font-extrabold text-[var(--color-primary)]/20">{s.step}</span>
              <h3 className="text-sm font-extrabold tracking-wide mt-2">{s.title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--color-primary)] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">F1</div>
            <span className="text-xs font-extrabold">PREDICT.GP</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">HOME</Link>
            <Link href="/predictions" className="text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">PREDICT</Link>
            <Link href="/leaderboard" className="text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">LEADERBOARD</Link>
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">
            © 2026 F1 PREDICT.GP — Fan prediction platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
