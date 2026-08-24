"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail, RotateCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { verifyOTP, resendOTP } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!email) router.push("/login");
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setOtp(digits);
    setError("");

    if (digits.length === 8) {
      handleVerify(digits);
    }
  };

  const handleVerify = async (otpString?: string) => {
    const code = otpString || otp;
    if (code.length !== 8) {
      setError("Please enter all 8 digits");
      return;
    }

    setError("");
    setLoading(true);

    const result = await verifyOTP(email, code);

    if (!result.success) {
      setError(result.message || "Verification failed");
      setLoading(false);
      return;
    }

    setSuccess("Email verified successfully! Redirecting...");
    setTimeout(() => router.push("/"), 1500);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    const result = await resendOTP(email);
    if (result.success) {
      setSuccess("A new code has been sent to your email");
      setOtp("");
      inputRef.current?.focus();
      setResendCooldown(60);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(result.message || "Failed to resend code");
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <img src="/geek-room-logo.png" alt="Geek Room" className="w-14 h-14 rounded-2xl mx-auto shadow-lg" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Verify Your Email</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              We sent an 8-digit code to
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Mail size={14} className="text-[var(--color-primary)]" />
              <span className="text-sm font-semibold">{maskedEmail}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl px-4 py-3 text-sm text-[var(--color-primary)]">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 rounded-xl px-4 py-3 text-sm text-[var(--color-green)]">
            <CheckCircle2 size={16} className="shrink-0" />
            {success}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={otp}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter 8-digit code"
            className={`w-full max-w-xs text-center text-2xl font-extrabold tracking-[0.3em] font-mono rounded-xl border-2 py-4 transition-all focus:outline-none ${
              otp.length === 8
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            } focus:border-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/30 placeholder:text-base placeholder:tracking-normal placeholder:font-normal`}
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={loading || otp.length !== 8}
          className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-[var(--color-primary)] font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              <RotateCw size={12} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
