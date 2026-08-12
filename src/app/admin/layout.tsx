"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Car,
  Trophy,
  Award,
  Users,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/admin", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/admin/races", label: "RACES", icon: Calendar },
  { href: "/admin/drivers", label: "DRIVERS", icon: Car },
  { href: "/admin/results", label: "RESULTS", icon: Trophy },
  { href: "/admin/prizes", label: "PRIZES", icon: Award },
  { href: "/admin/users", label: "USERS", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const res = await fetch(`/api/auth/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { router.replace("/"); return; }
      const json = await res.json();
      if (json.user?.role !== "admin") { router.replace("/"); return; }
      setAuthorized(true);
    }
    check();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1 hidden md:block">
        <div className="flex items-center gap-2 px-3 mb-4">
          <div className="bg-[var(--color-primary)] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">F1</div>
          <span className="text-[10px] font-extrabold tracking-[0.12em] text-[var(--color-text-secondary)]">ADMIN PANEL</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-[11px] font-extrabold tracking-[0.06em] transition-colors ${
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30"
              }`}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
