"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FlagTriangleRight,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Calendar,
  AtSign,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    birthday: "",
    telephone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal info, 2 = account details

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const passwordChecks = [
    { label: "At least 8 characters", valid: form.password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(form.password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(form.password) },
    { label: "One number", valid: /[0-9]/.test(form.password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const allPasswordChecksPass = passwordChecks.every((c) => c.valid);

  const validateStep1 = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.surname.trim()) return "Surname is required";
    if (!form.address.trim()) return "Address is required";
    if (form.address.trim().length < 5) return "Address must be at least 5 characters";
    return null;
  };

  const validateStep2 = () => {
    if (!form.username.trim()) return "Username is required";
    if (form.username.trim().length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_.-]+$/.test(form.username)) return "Username can only contain letters, numbers, dots, hyphens, underscores";
    if (!form.email.trim()) return "Email is required";
    if (!form.password) return "Password is required";
    if (!allPasswordChecksPass) return "Password does not meet all requirements";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setLoading(true);

    const result = await register({
      name: form.name.trim(),
      surname: form.surname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      address: form.address.trim(),
      birthday: form.birthday || undefined,
      telephone: form.telephone.trim() || undefined,
    });

    if (!result.success) {
      setError(result.message || "Registration failed");
      setLoading(false);
      return;
    }

    if (result.requiresVerification) {
      router.push(`/verify?email=${encodeURIComponent(result.email || form.email)}`);
    } else {
      router.push("/");
    }
  };

  const inputClass =
    "w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm pl-11 pr-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors";

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
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Create Account</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {step === 1 ? "Start with your personal details" : "Set up your account credentials"}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors ${
                  s === step
                    ? "bg-[var(--color-primary)] text-white"
                    : s < step
                    ? "bg-[var(--color-green)] text-white"
                    : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                }`}
              >
                {s < step ? <CheckCircle2 size={14} /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-0.5 rounded-full transition-colors ${
                    step > 1 ? "bg-[var(--color-green)]" : "bg-[var(--color-border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-sm px-4 py-3 text-sm text-[var(--color-primary)]">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                  Name <span className="text-[var(--color-primary)]">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="John"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                  Surname <span className="text-[var(--color-primary)]">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    value={form.surname}
                    onChange={(e) => updateField("surname", e.target.value)}
                    placeholder="Doe"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Address <span className="text-[var(--color-primary)]">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Main Street, City"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Birthday
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => updateField("birthday", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Telephone
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => updateField("telephone", e.target.value)}
                  placeholder="+355 69 123 4567"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-[var(--color-primary)] text-white rounded-sm py-3.5 text-sm font-bold hover:opacity-90 transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Username (display name) <span className="text-[var(--color-primary)]">*</span>
              </label>
              <div className="relative">
                <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="speedracer_99"
                  required
                  className={inputClass}
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 ml-1">
                This is the name other users will see on the leaderboard
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Email <span className="text-[var(--color-primary)]">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={inputClass}
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 ml-1">
                We&apos;ll send a verification code to this email
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Password <span className="text-[var(--color-primary)]">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
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
              {form.password && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-[11px]">
                      <CheckCircle2
                        size={12}
                        className={check.valid ? "text-[var(--color-green)]" : "text-[var(--color-text-secondary)]/30"}
                      />
                      <span className={check.valid ? "text-[var(--color-green)]" : "text-[var(--color-text-secondary)]"}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                Confirm Password <span className="text-[var(--color-primary)]">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-[11px] text-[var(--color-primary)] mt-1 ml-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-[var(--color-border)] text-[var(--color-text)] rounded-sm py-3.5 text-sm font-bold hover:bg-white/[0.02] transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[var(--color-primary)] text-white rounded-sm py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-primary)] font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
