"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Calendar, AlertCircle, Loader2, AtSign } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    username: "",
    address: "",
    telephone: "",
    birthday: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }
    if (form.username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(form.username.trim())) {
      setError("Username can only contain letters, numbers, dots, hyphens, underscores");
      return;
    }
    if (!form.address.trim()) {
      setError("Address is required");
      return;
    }
    if (form.address.trim().length < 5) {
      setError("Address must be at least 5 characters");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          username: form.username.trim(),
          address: form.address.trim(),
          telephone: form.telephone.trim() || null,
          birthday: form.birthday || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshProfile();
        router.replace("/");
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img src="/geek-room-logo.png" alt="Geek Room" className="w-14 h-14 rounded-2xl mx-auto shadow-lg" />
          <div>
            <div className="text-[9px] font-extrabold text-[#2DB544] tracking-[0.2em] uppercase">Geek Room</div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Complete Your Profile</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {user?.name ? `Welcome ${user.name}! ` : ""}Just a few more details to get started
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl px-4 py-3 text-sm text-[var(--color-primary)]">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

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
            <p className="text-[11px] text-[var(--color-primary)] mt-1.5 ml-1 flex items-center gap-1">
              <AlertCircle size={11} /> An Albanian address is obligatory to receive the prizes awarded.
            </p>
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
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3.5 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
