"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/signup", "/verify", "/forgot-password"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.replace("/login");
    }

    if (user && isPublicRoute) {
      router.replace("/");
    }
  }, [user, loading, isPublicRoute, router]);

  // Show loading spinner while checking auth
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

  // Not logged in on a protected route — don't render (redirect is happening)
  if (!user && !isPublicRoute) return null;

  // Logged in on a public route — don't render (redirect is happening)
  if (user && isPublicRoute) return null;

  return <>{children}</>;
}
