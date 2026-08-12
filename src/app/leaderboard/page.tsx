export const dynamic = "force-dynamic";

import { Trophy, Users, Medal, ChevronRight } from "lucide-react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";

interface Prize { position: number; icon_url: string; label: string; }

async function getLeaderboard() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username, name, surname, points, predictions_count")
      .eq("status", "active")
      .neq("role", "admin")
      .order("points", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((u, i) => ({
      id: u.id,
      rank: i + 1,
      name: `${u.name} ${u.surname.charAt(0)}.`,
      points: u.points || 0,
      avatar: ((u.name || "")[0] + (u.surname || "")[0]).toUpperCase(),
    }));
  } catch { return []; }
}

async function getPrizeIcons(): Promise<Prize[]> {
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

export default async function LeaderboardPage() {
  const [leaderboard, prizes] = await Promise.all([
    getLeaderboard() as Promise<Array<{ id: string; rank: number; name: string; points: number; avatar: string }>>,
    getPrizeIcons(),
  ]);

  const prizeMap = new Map(prizes.map(p => [p.position, p]));

  const badgeColor = (rank: number) =>
    rank === 1 ? "var(--color-gold)" : rank === 2 ? "var(--color-silver)" : rank === 3 ? "var(--color-bronze)" : "transparent";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold)]/10 flex items-center justify-center mx-auto">
          <Trophy size={28} className="text-[var(--color-gold)]" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Live Leaderboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Updated after every race weekend</p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-[var(--color-primary)]" />
          <h3 className="font-bold text-sm">Season Overview</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={16} className="text-[var(--color-text-secondary)]" />
            </div>
            <div className="text-2xl font-extrabold">{leaderboard.length}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Active Players</div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <span className="w-10">#</span>
            <span className="flex-1">Player</span>
            <span>Points</span>
          </div>
        </div>
        {leaderboard.map((item, index) => (
          <Link key={item.rank} href={`/leaderboard/${item.id}`} className={`group flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer ${index > 0 ? "border-t border-[var(--color-border)]" : ""}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
              style={{
                backgroundColor: badgeColor(item.rank),
                color: item.rank <= 3 ? "#fff" : "var(--color-text)",
                border: item.rank > 3 ? "1px solid var(--color-border)" : "none",
              }}
            >
              {item.rank}
            </div>
            {prizeMap.has(item.rank) && (
              <img src={prizeMap.get(item.rank)!.icon_url} alt={prizeMap.get(item.rank)!.label} className="w-6 h-6 object-contain shrink-0" />
            )}
            <div className="w-9 h-9 rounded-full bg-[var(--color-background)] flex items-center justify-center text-[11px] font-bold text-[var(--color-text-secondary)] shrink-0">
              {item.avatar}
            </div>
            <span className="flex-1 text-sm font-semibold group-hover:text-[var(--color-primary)] transition-colors">{item.name}</span>
            <span className="text-sm font-extrabold tabular-nums">{item.points} <span className="text-[var(--color-text-secondary)] font-medium text-xs">pts</span></span>
            <ChevronRight size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
        {leaderboard.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)] p-5">No leaderboard data</p>
        )}
      </div>
    </div>
  );
}
