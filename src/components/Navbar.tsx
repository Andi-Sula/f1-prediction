"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  Crosshair,
  User,
  Settings,
  Menu,
  X,
  LogIn,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/predictions", label: "PREDICT", icon: Crosshair },
  { href: "/leaderboard", label: "LEADERBOARD", icon: Trophy },
  { href: "/profile", label: "PROFILE", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  if (["/login", "/signup", "/verify", "/forgot-password"].includes(pathname)) return null;

  return (
    <>
      {/* ── Desktop Top Bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)] hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[var(--color-primary)] text-white text-[10px] font-extrabold px-2 py-1 rounded-sm">F1</div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-[var(--color-primary)] tracking-[0.15em] leading-none">GEEK ROOM</span>
              <span className="text-sm font-extrabold tracking-tight leading-tight">PREDICT<span className="text-[var(--color-text-secondary)]">.GP</span></span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`px-4 py-1.5 rounded-sm text-[11px] font-extrabold tracking-[0.08em] transition-all ${
                    active ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}>
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link href="/admin"
                className={`px-4 py-1.5 rounded-sm text-[11px] font-extrabold tracking-[0.08em] transition-all ${
                  isAdmin ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}>
                ADMIN
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-text-secondary)] hidden lg:inline">{user.username}</span>
                    <button onClick={logout} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors" title="Sign out">
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <Link href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[var(--color-primary)] text-white text-[11px] font-extrabold tracking-[0.08em] hover:opacity-90 transition-all">
                    SIGN IN
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)] md:hidden">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[var(--color-primary)] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">F1</div>
            <div className="flex flex-col">
              <span className="text-[7px] font-bold text-[var(--color-primary)] tracking-[0.12em] leading-none">GEEK ROOM</span>
              <span className="text-xs font-extrabold tracking-tight leading-tight">PREDICT<span className="text-[var(--color-text-secondary)]">.GP</span></span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!loading && !user && (
              <Link href="/login" className="px-3 py-1.5 rounded-sm bg-[var(--color-primary)] text-white text-[10px] font-extrabold">
                SIGN IN
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 rounded-sm hover:bg-[var(--color-border)]/30 flex items-center justify-center transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 space-y-1">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-extrabold">
                  {user.initials || user.username[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-sm font-bold">{user.username}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">{user.email}</div>
                </div>
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors ${
                    active ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/20"
                  }`}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors ${
                  isAdmin ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/20"
                }`}>
                <Settings size={16} />
                ADMIN
              </Link>
            )}
            {user && (
              <button onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/20 transition-colors">
                <LogOut size={16} />
                SIGN OUT
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-sm transition-all min-w-[60px] ${
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"
                }`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[9px] font-extrabold tracking-wider">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[var(--color-primary)]" />}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
