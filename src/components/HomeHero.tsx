"use client";
import Link from "next/link";
import { Flame, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function HomeHero() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-8">
        <div className="h-16 animate-pulse bg-[var(--color-border)]/30 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">Welcome to F1 Predictor</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-1.5">
              <Flame size={14} className="text-[var(--color-primary)]" />
              Sign in to make predictions and compete on the leaderboard!
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-all shrink-0"
          >
            <LogIn size={16} />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-lg shadow-[var(--color-primary)]/20 shrink-0">
            {user.initials || user.username[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
              Welcome back, {user.username}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-1.5">
              <Flame size={14} className="text-[var(--color-primary)]" />
              Race Week — Make your predictions before qualifying!
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-extrabold">{user.points}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Points</div>
          </div>
          <div className="w-px h-10 bg-[var(--color-border)]" />
          <div className="text-center">
            <div className="text-2xl font-extrabold">{user.rank ? `#${user.rank}` : "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Rank</div>
          </div>
        </div>
      </div>
    </div>
  );
}
