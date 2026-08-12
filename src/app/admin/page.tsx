export const dynamic = "force-dynamic";

import {
  Users,
  Crosshair,
  FlagTriangleRight,
  Star,
  Trophy,
  Calendar,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Car,
  Award,
} from "lucide-react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";

async function getDashboardStats() {
  const [usersRes, racesRes, predictionsRes, pointsRes] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("races").select("id, status"),
    supabaseAdmin.from("predictions").select("id, race_id, races!inner(status)", { count: "exact" }),
    supabaseAdmin.from("users").select("points").neq("role", "admin"),
  ]);

  const totalUsers = usersRes.count || 0;

  const races = racesRes.data || [];
  const completedRaces = races.filter(r => ["completed", "cancelled"].includes(r.status)).length;
  const totalRaces = races.length;

  // Active predictions = predictions for upcoming races
  const activePredictions = (predictionsRes.data || []).filter(
    (p: any) => (p as any).races?.status === "upcoming"
  ).length;
  const closedPredictions = (predictionsRes.data || []).filter(
    (p: any) => (p as any).races?.status !== "upcoming"
  ).length;

  const totalPoints = (pointsRes.data || []).reduce((sum, u) => sum + (u.points || 0), 0);

  return { totalUsers, activePredictions, closedPredictions, completedRaces, totalRaces, totalPoints };
}

async function getRecentPredictions() {
  const { data } = await supabaseAdmin
    .from("predictions")
    .select("user_id, race_id, updated_at, users(username), races(name)")
    .order("updated_at", { ascending: false })
    .limit(5);
  return (data || []).map((p: any) => ({
    username: p.users?.username || "Unknown",
    raceName: p.races?.name || "Unknown Race",
    time: p.updated_at,
  }));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function AdminDashboard() {
  const [stats, recentPredictions] = await Promise.all([getDashboardStats(), getRecentPredictions()]);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, trend: `registered` },
    { label: "Active Predictions", value: stats.activePredictions.toLocaleString(), icon: Crosshair, trend: `${stats.closedPredictions} closed` },
    { label: "Races Completed", value: stats.completedRaces.toLocaleString(), icon: FlagTriangleRight, trend: `of ${stats.totalRaces} total` },
    { label: "Total Points", value: stats.totalPoints.toLocaleString(), icon: Star, trend: "all players" },
  ];
  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Overview of the F1 Predictor platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-sm bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Icon size={18} className="text-[var(--color-primary)]" />
                </div>
                <TrendingUp size={14} className="text-[var(--color-green)]" />
              </div>
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">{s.label}</div>
              <div className="text-[10px] text-[var(--color-green)] font-bold mt-2">{s.trend}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Predictions */}
        <div className="lg:col-span-3 bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[var(--color-text-secondary)]" />
            Recent Predictions
          </h3>
          <div className="space-y-0 divide-y divide-[var(--color-border)]">
            {recentPredictions.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] py-4">No predictions yet</p>
            )}
            {recentPredictions.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-3.5">
                <div className="w-8 h-8 rounded-sm bg-[var(--color-background)] flex items-center justify-center shrink-0">
                  <Crosshair size={14} className="text-[var(--color-text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Prediction saved</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{p.username} — {p.raceName}</div>
                </div>
                <span className="text-[11px] text-[var(--color-text-secondary)] shrink-0">{timeAgo(p.time)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[var(--color-text-secondary)]" />
            Quick Actions
          </h3>
          <div className="space-y-2.5">
            <Link href="/admin/results" className="group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all">
              <Trophy size={18} className="text-[var(--color-primary)]" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Set Race Results</div>
                <div className="text-[10px] text-[var(--color-text-secondary)]">Publish results & conditions</div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
            </Link>
            <Link href="/admin/races" className="group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all">
              <Calendar size={18} className="text-[var(--color-primary)]" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Manage Calendar</div>
                <div className="text-[10px] text-[var(--color-text-secondary)]">Add or edit race events</div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
            </Link>
            <Link href="/admin/users" className="group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all">
              <Users size={18} className="text-[var(--color-primary)]" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Manage Users</div>
                <div className="text-[10px] text-[var(--color-text-secondary)]">View & edit user accounts</div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
            </Link>
            <Link href="/admin/drivers" className="group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all">
              <Car size={18} className="text-[var(--color-primary)]" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Manage Drivers</div>
                <div className="text-[10px] text-[var(--color-text-secondary)]">Add, edit, or deactivate drivers</div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
            </Link>
            <Link href="/admin/prizes" className="group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all">
              <Award size={18} className="text-[var(--color-primary)]" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Prizes</div>
                <div className="text-[10px] text-[var(--color-text-secondary)]">Manage top 3 leaderboard prizes</div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
