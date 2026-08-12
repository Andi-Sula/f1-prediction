"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
  RotateCw,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function ForgotPasswordContent() {
  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // 1=email, 2=OTP, 3=new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const passwordChecks = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(newPassword) },
    { label: "One lowercase letter", valid: /[a-z]/.test(newPassword) },
    { label: "One number", valid: /[0-9]/.test(newPassword) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const allPasswordChecksPass = passwordChecks.every((c) => c.valid);

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);

    const result = await forgotPassword(email);
    if (!result.success) {
      setError(result.message || "Failed to send reset code");
    } else {
      setStep(2);
      setResendCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    setLoading(false);
  };

  // OTP input handlers
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 7) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 8) {
        setStep(3);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 8; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 7);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 8) {
      setStep(3);
    }
  };

  const handleConfirmOTP = () => {
    const code = otp.join("");
    if (code.length !== 8) {
      setError("Please enter all 8 digits");
      return;
    }
    setStep(3);
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");

    const result = await forgotPassword(email);
    if (result.success) {
      setSuccess("A new code has been sent to your email");
      setOtp(["", "", "", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendCooldown(60);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(result.message || "Failed to resend code");
    }
  };

  // Step 3: Reset password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPasswordChecksPass) {
      setError("Password does not meet all requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    const otpString = otp.join("");
    const result = await resetPassword(email, otpString, newPassword);
    if (!result.success) {
      setError(result.message || "Password reset failed");
    } else {
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded bg-[var(--color-primary)] flex items-center justify-center mx-auto shadow-lg shadow-[var(--color-primary)]/20">
            <KeyRound size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {step === 1 ? "Reset Password" : step === 2 ? "Enter Code" : "New Password"}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {step === 1
                ? "Enter your email to receive a reset code"
                : step === 2
                ? <>We sent an 8-digit code to <span className="font-semibold">{maskedEmail}</span></>
                : "Create a new password for your account"}
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-sm px-4 py-3 text-sm text-[var(--color-primary)]">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 rounded-sm px-4 py-3 text-sm text-[var(--color-green)]">
            <CheckCircle2 size={16} className="shrink-0" />
            {success}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm pl-11 pr-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white rounded-sm py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <div key={i} className="relative">
                  {i === 4 && (
                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-border)]" />
                  )}
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-11 h-14 text-center text-xl font-extrabold rounded-sm border-2 transition-all focus:outline-none ${
                      digit
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]"
                    } focus:border-[var(--color-primary)] text-[var(--color-text)]`}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmOTP}
              disabled={otp.join("").length !== 8}
              className="w-full bg-[var(--color-primary)] text-white rounded-sm py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>

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
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
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
              {newPassword && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-[11px]">
                      <CheckCircle2 size={12} className={check.valid ? "text-[var(--color-green)]" : "text-[var(--color-text-secondary)]/30"} />
                      <span className={check.valid ? "text-[var(--color-green)]" : "text-[var(--color-text-secondary)]"}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm pl-11 pr-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-[var(--color-primary)] mt-1 ml-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white rounded-sm py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : "Reset Password"}
            </button>
          </form>
        )}

        {/* Back to login */}
        <p className="text-center">
          <Link href="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] inline-flex items-center gap-1.5 font-semibold transition-colors">
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
