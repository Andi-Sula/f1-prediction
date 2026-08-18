"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // Check if profile needs completing
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const res = await fetch("/api/auth/profile", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && !data.user.address) {
                router.replace("/complete-profile");
                return;
              }
            }
          }
          router.replace("/");
          return;
        }
      }

      router.replace("/login?error=auth_failed");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--color-text-secondary)]">Signing you in...</p>
      </div>
    </div>
  );
}
