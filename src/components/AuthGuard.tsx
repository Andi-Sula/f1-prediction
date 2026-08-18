"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/signup", "/verify", "/forgot-password", "/auth/callback"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, profileIncomplete } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isCompleteProfile = pathname === "/complete-profile";

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.replace("/login");
    }

    if (user && isPublicRoute) {
      router.replace("/");
    }

    // Redirect OAuth users with incomplete profiles
    if (user && profileIncomplete && !isCompleteProfile) {
      router.replace("/complete-profile");
    }
  }, [user, loading, isPublicRoute, isCompleteProfile, profileIncomplete, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
          <span className="text-sm text-[var(--color-text-secondary)] font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user && !isPublicRoute) return null;
  if (user && isPublicRoute) return null;
  if (user && profileIncomplete && !isCompleteProfile) return null;

  return <>{children}</>;
}
