export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Trophy,
  ChevronRight,
  Crosshair,
  BarChart3,
  Flame,
  Award,
  FlagTriangleRight,
} from "lucide-react";
import RaceCalendar from "@/components/RaceCalendar";
import HomeHero from "@/components/HomeHero";
import { supabaseAdmin } from "@/lib/supabase-server";

const positionTitles = ["1st Place", "2nd Place", "3rd Place"];
const positionColors = ["var(--color-gold)", "var(--color-silver)", "var(--color-bronze)"];

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

export default async function HomePage() {
  const prizes = await getPrizes() as Array<{ position: number; icon_url: string; label: string }>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Hero */}
      <HomeHero />

      {/* Race Calendar */}
      <section>
        <SectionHeader icon={<FlagTriangleRight size={16} className="text-[var(--color-primary)]" />} title="2026 Race Calendar" />
        <RaceCalendar />
      </section>

      <Ticks />

      {/* Awards of the Weekend */}
      <section>
        <SectionHeader icon={<Trophy size={16} className="text-[var(--color-gold)]" />} title="Awards of the Weekend" />
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((pos) => {
              const prize = prizes.find((p: { position: number }) => p.position === pos);
              return (
                <div key={pos} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-md"
                    style={{ backgroundColor: positionColors[pos - 1] }}
                  >
                    {pos}
                  </div>
                  {prize?.icon_url && (
                    <img src={prize.icon_url} alt={prize.label} className="w-8 h-8 object-contain" />
                  )}
                  <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{positionTitles[pos - 1]}</div>
                  <div className="text-sm font-semibold leading-snug">{prize?.label || "TBA"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/predictions"
          className="group flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/50 hover:shadow-lg hover:shadow-[var(--color-primary)]/5 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Crosshair size={22} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">Make Predictions</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Pick your podium for this weekend</div>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link
          href="/leaderboard"
          className="group flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/50 hover:shadow-lg hover:shadow-[var(--color-primary)]/5 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/10 flex items-center justify-center">
            <BarChart3 size={22} className="text-[var(--color-gold)]" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">View Leaderboard</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">See where you stand this season</div>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </section>


    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-xs font-extrabold tracking-[0.15em] uppercase">{title}</h2>
    </div>
  );
}

function Ticks() {
  return (
    <div className="flex gap-[3px] items-end h-4">
      {[8, 5, 14, 8, 5, 14, 8, 5, 14, 8, 5, 14, 8, 5, 14].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            height: h,
            backgroundColor: i % 3 === 2 ? "var(--color-primary)" : "var(--color-border)",
          }}
        />
      ))}
    </div>
  );
}
