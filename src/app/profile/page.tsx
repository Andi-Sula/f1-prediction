"use client";
import { useEffect, useState } from "react";
import {
  User,
  Star,
  CheckCircle,
  CheckCircle2,
  Moon,
  Sun,
  Bell,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Trophy,
  Zap,
  Tv,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  username: string;
  email: string;
  name: string;
  surname: string;
  points: number;
  rank: number;
  predictionsCount: number;
  racesCompleted: number;
}

export default function ProfilePage() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [raiffeisenCode, setRaiffeisenCode] = useState("");
  const [raiffeisenLinked, setRaiffeisenLinked] = useState(false);
  const [digitalbId, setDigitalbId] = useState("");
  const [digitalbLinked, setDigitalbLinked] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.user) setProfile(json.user);
    })();
  }, []);

  const initials = profile
    ? ((profile.name?.[0] || "") + (profile.surname?.[0] || "")).toUpperCase() || profile.username[0]?.toUpperCase()
    : "U";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-xl shadow-[var(--color-primary)]/20">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{profile ? `${profile.name} ${profile.surname}` : "Loading..."}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{profile?.email || ""}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <Star size={20} className="text-[var(--color-gold)] mx-auto mb-1.5" />
            <div className="text-xl font-extrabold">{profile?.points ?? "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Points</div>
          </div>
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <Trophy size={20} className="text-[var(--color-primary)] mx-auto mb-1.5" />
            <div className="text-xl font-extrabold">{profile?.rank ? `#${profile.rank}` : "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Rank</div>
          </div>
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <CheckCircle size={20} className="text-[var(--color-green)] mx-auto mb-1.5" />
            <div className="text-xl font-extrabold">{profile?.predictionsCount ?? "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Predictions</div>
          </div>
        </div>
      </div>

      {/* Boosts & Promotions */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2">
          <Zap size={14} className="text-[var(--color-primary)]" />
          Boosts & Promotions
        </h3>

        {/* Raiffeisen Boost */}
        <div className="bg-[#FFDD00] rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
              <Zap size={20} className="text-black" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-black">Raiffeisen Boost</h3>
                <span className="bg-black text-[#FFDD00] text-[10px] font-extrabold px-2 py-0.5 rounded-md">+15 PTS</span>
              </div>
              <p className="text-xs text-black/70 mb-3">Enter the last 4 digits of your Raiffeisen card to earn bonus points each race.</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="• • • •"
                  value={raiffeisenCode}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); setRaiffeisenCode(v); setRaiffeisenLinked(v.length === 4); }}
                  className="w-24 text-center font-bold font-mono text-lg tracking-widest border-none rounded-xl bg-white/90 py-2.5 text-black placeholder:text-black/40 focus:outline-2 focus:outline-black/20 transition-colors"
                />
                {raiffeisenLinked && (
                  <div className="flex items-center gap-1.5 text-black text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    Linked — +15 pts per race
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DigitAlb 2× Points */}
        <div className="bg-[var(--color-primary)] rounded-2xl p-5 shadow-lg shadow-[var(--color-primary)]/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Tv size={20} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-white">DigitAlb 2× Points</h3>
                <span className="bg-white text-[var(--color-primary)] text-[10px] font-extrabold px-2 py-0.5 rounded-md">2× MULTIPLIER</span>
              </div>
              <p className="text-xs text-white/80 mb-3">Add your subscriber ID to double your points — usable in 3 races per season.</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="DigitAlb username / card number"
                  value={digitalbId}
                  onChange={e => { setDigitalbId(e.target.value); setDigitalbLinked(e.target.value.length >= 4); }}
                  className="flex-1 min-w-0 font-medium text-sm border-none rounded-xl bg-white/95 px-4 py-2.5 text-[var(--color-background)] placeholder:text-[var(--color-text-secondary)] focus:outline-2 focus:outline-white transition-colors"
                />
                {digitalbLinked && (
                  <div className="flex items-center gap-1.5 text-white text-sm font-semibold shrink-0">
                    <CheckCircle2 size={16} />
                    Linked — 3 uses left
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <User size={16} className="text-[var(--color-text-secondary)]" />
          Settings
        </h3>
        <div className="divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={18} className="text-[var(--color-primary)]" /> : <Sun size={18} className="text-[var(--color-primary)]" />}
              <span className="text-sm font-semibold">Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-7 rounded-full transition-colors relative ${isDark ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-200 ${isDark ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-[var(--color-primary)]" />
              <span className="text-sm font-semibold">Notifications</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-7 rounded-full transition-colors relative ${notifications ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-200 ${notifications ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[var(--color-primary)]" />
              <span className="text-sm font-semibold">Language</span>
            </div>
            <span className="text-sm text-[var(--color-text-secondary)] font-medium">English</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <button className="w-full flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors text-left group">
          <HelpCircle size={18} className="text-[var(--color-text-secondary)]" />
          <span className="flex-1 text-sm font-semibold">Help & Support</span>
          <ChevronRight size={16} className="text-[var(--color-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors text-left group">
          <Info size={18} className="text-[var(--color-text-secondary)]" />
          <span className="flex-1 text-sm font-semibold">About</span>
          <ChevronRight size={16} className="text-[var(--color-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-primary)]/5 transition-colors text-left group">
          <LogOut size={18} className="text-[var(--color-primary)]" />
          <span className="flex-1 text-sm font-semibold text-[var(--color-primary)]">Log Out</span>
          <ChevronRight size={16} className="text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
