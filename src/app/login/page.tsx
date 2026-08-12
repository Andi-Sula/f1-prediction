"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, FlagTriangleRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.requiresVerification) {
      router.push(`/verify?email=${encodeURIComponent(result.email || email)}`);
      return;
    }

    if (!result.success) {
      setError(result.message || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded bg-[var(--color-primary)] flex items-center justify-center mx-auto shadow-lg shadow-[var(--color-primary)]/20">
            <FlagTriangleRight size={24} className="text-white" />
          </div>
          <div>
            <div className="text-[9px] font-extrabold text-[var(--color-primary)] tracking-[0.2em] uppercase">Geek Room</div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Welcome Back</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Sign in to your F1 Predictor account</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-sm px-4 py-3 text-sm text-[var(--color-primary)]">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm pl-11 pr-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm pl-11 pr-12 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white rounded-sm py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-[var(--color-primary)] font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--color-primary)] font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
