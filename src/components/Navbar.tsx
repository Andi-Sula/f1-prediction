"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Crosshair,
  User,
  Settings,
  Gift,
  Menu,
  X,
  LogIn,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/predictions", label: "Predictions", icon: Crosshair },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  // Hide navbar on auth pages
  if (["/login", "/signup", "/verify"].includes(pathname)) return null;

  return (
    <>
      {/* ── Desktop Top Bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/geek-room-logo.png" alt="Geek Room" className="w-9 h-9 rounded-lg transition-transform group-hover:scale-105" />
            <div className="leading-tight">
              <div className="text-[9px] font-extrabold text-[var(--color-text)] tracking-[0.2em] uppercase">Geek Room</div>
              <div className="text-sm font-extrabold text-[#2DB544] tracking-tight">F1 PREDICTOR</div>
            </div>
          </Link>

          <div className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                    active ? "bg-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary)]/25" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-white/5"
                  }`}>
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="w-px h-7 bg-[var(--color-border)] mx-2.5" />
            {user?.role === "admin" && (
              <Link href="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                  isAdmin ? "bg-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary)]/25" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-white/5"
                }`}>
                <Settings size={16} strokeWidth={isAdmin ? 2.5 : 2} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            {/* Auth section */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-extrabold">
                      {user.initials || user.username[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--color-text)] hidden lg:inline max-w-[100px] truncate">
                      {user.username}
                    </span>
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-white/5 transition-all"
                      title="Sign out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all ml-2"
                  >
                    <LogIn size={16} />
                    <span className="hidden lg:inline">Sign In</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Top Bar (brand + hamburger) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] md:hidden">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/geek-room-logo.png" alt="Geek Room" className="w-8 h-8 rounded-lg" />
            <div className="leading-tight">
              <div className="text-[8px] font-extrabold text-[var(--color-text)] tracking-[0.2em] uppercase">Geek Room</div>
              <div className="text-xs font-extrabold text-[#2DB544] tracking-tight">F1 PREDICTOR</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!loading && !user && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white"
              >
                <LogIn size={14} />
                Sign In
              </Link>
            )}
            {user && (
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white text-[10px] font-extrabold">
                {user.initials || user.username[0]?.toUpperCase() || "U"}
              </div>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 space-y-1">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-extrabold">
                  {user.initials || user.username[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-sm font-bold">{user.username}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">{user.email}</div>
                </div>
              </div>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isAdmin ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:bg-white/5"
                }`}>
                <Settings size={16} />
                Admin Dashboard
              </Link>
            )}
            {user && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-t border-[var(--color-border)] md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px] ${
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"
                }`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-bold">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[var(--color-primary)]" />}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
