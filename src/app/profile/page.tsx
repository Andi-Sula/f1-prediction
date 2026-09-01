"use client";
import { useEffect, useState } from "react";
import {
  User,
  Star,
  CheckCircle,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Trophy,
  Zap,
  Tv,
  Loader2,
  Pencil,
  Save,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  username: string;
  email: string;
  name: string;
  surname: string;
  address: string;
  telephone: string;
  birthday: string;
  createdAt: string;
  points: number;
  rank: number;
  predictionsCount: number;
  racesCompleted: number;
  digitalbId: string | null;
  digitalbActive: boolean;
  digitalbUsesLeft: number;
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const [raiffeisenCode, setRaiffeisenCode] = useState("");
  const [raiffeisenLinked, setRaiffeisenLinked] = useState(false);
  const [digitalbId, setDigitalbId] = useState("");
  const [digitalbLinked, setDigitalbLinked] = useState(false);
  const [digitalbUsesLeft, setDigitalbUsesLeft] = useState(3);
  const [digitalbLoading, setDigitalbLoading] = useState(false);
  const [digitalbMsg, setDigitalbMsg] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", surname: "", username: "", email: "", telephone: "", birthday: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.user) {
        setProfile(json.user);
        if (json.user.digitalbId) {
          setDigitalbId(json.user.digitalbId);
          setDigitalbLinked(json.user.digitalbActive);
          setDigitalbUsesLeft(json.user.digitalbUsesLeft ?? 3);
        }
      }
    })();
  }, []);

  const initials = profile
    ? ((profile.name?.[0] || "") + (profile.surname?.[0] || "")).toUpperCase() || profile.username[0]?.toUpperCase()
    : "U";

  const openEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || "",
      surname: profile.surname || "",
      username: profile.username || "",
      email: profile.email || "",
      telephone: profile.telephone || "",
      birthday: profile.birthday || "",
      address: profile.address || "",
    });
    setEditMsg("");
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!editForm.username.trim()) { setEditMsg("Username is required"); return; }
    if (editForm.username.trim().length < 3) { setEditMsg("Username must be at least 3 characters"); return; }
    if (!editForm.name.trim()) { setEditMsg("First name is required"); return; }
    if (!editForm.surname.trim()) { setEditMsg("Last name is required"); return; }
    if (!editForm.address.trim()) { setEditMsg("Address is required"); return; }
    if (editForm.address.trim().length < 5) { setEditMsg("Address must be at least 5 characters"); return; }
    setSaving(true);
    setEditMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) { setEditMsg(json.message || "Failed to save"); return; }
      setProfile({ ...profile!, ...editForm });
      setEditing(false);
    } catch {
      setEditMsg("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-10">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-xl shadow-[var(--color-primary)]/20">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{profile ? `${profile.name} ${profile.surname}` : "Loading..."}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">@{profile?.username || ""}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{profile?.email || ""}</p>
          {profile?.createdAt && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          )}
        </div>
        {!editing && (
          <button onClick={openEdit} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline">
            <Pencil size={12} /> Edit Profile
          </button>
        )}
      </div>

      {/* Edit Profile */}
      {editing && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Pencil size={14} className="text-[var(--color-primary)]" /> Edit Profile
          </h3>
          {editMsg && (
            <div className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{editMsg}</div>
          )}
          <div>
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Username <span className="text-[var(--color-primary)]">*</span></label>
            <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">First Name <span className="text-[var(--color-primary)]">*</span></label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Last Name <span className="text-[var(--color-primary)]">*</span></label>
              <input value={editForm.surname} onChange={e => setEditForm({ ...editForm, surname: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Email</label>
            <input type="email" value={editForm.email} disabled
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-secondary)] cursor-not-allowed opacity-60" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Address <span className="text-[var(--color-primary)]">*</span></label>
            <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="123 Main Street, City"
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            <p className="text-[10px] text-black mt-1.5 ml-1 flex items-center gap-1">
              
              An Albanian address is obligatory to receive the prizes awarded.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Telephone</label>
              <input type="tel" value={editForm.telephone} onChange={e => setEditForm({ ...editForm, telephone: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Birthday</label>
              <input type="date" value={editForm.birthday} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-bold hover:bg-[var(--color-background)] transition-colors">
              Cancel
            </button>
            <button onClick={saveProfile} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <Star size={20} className="text-[var(--color-gold)] mx-auto mb-1.5" />
            <div className="text-xl font-extrabold">{profile?.points ?? "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Points</div>
          </div>
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <Trophy size={20} className="text-[var(--color-primary)] mx-auto mb-1.5" />
            <div className="text-xl font-extrabold">{profile?.rank ? `#${profile.rank}` : "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Rank</div>
          </div>
          <div className="text-center bg-[var(--color-background)] rounded-xl py-4">
            <CheckCircle size={20} className="text-[var(--color-green)] mx-auto mb-1.5" />
            <div className="text-xl font-extrabold">{profile?.predictionsCount ?? "—"}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mt-0.5">Predictions</div>
          </div>
        </div>
      </div>

      {/* Boosts & Promotions */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2">
          <Zap size={14} className="text-[var(--color-primary)]" />
          Boosts & Promotions
        </h3>

        {/* Raiffeisen Boost */}
        <div className="bg-[#FFDD00] rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src="/raiffeisen-logo.png" alt="Raiffeisen" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-black">Raiffeisen Boost</h3>
                <span className="bg-black text-[#FFDD00] text-[10px] font-extrabold px-2 py-0.5 rounded-md">+15 PTS</span>
              </div>
              <p className="text-xs text-black/70 mb-3">Enter the last 4 digits of your Raiffeisen card to earn bonus points each race.</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="• • • •"
                  value={raiffeisenCode}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); setRaiffeisenCode(v); setRaiffeisenLinked(v.length === 4); }}
                  className="w-24 text-center font-bold font-mono text-lg tracking-widest border-none rounded-xl bg-white/90 py-2.5 text-black placeholder:text-black/40 focus:outline-2 focus:outline-black/20 transition-colors"
                />
                {raiffeisenLinked && (
                  <div className="flex items-center gap-1.5 text-black text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    Linked — +15 pts per race
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DigitAlb 2× Points */}
        <div className="bg-[var(--color-primary)] rounded-2xl p-5 shadow-lg shadow-[var(--color-primary)]/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src="/digitalb-logo.webp" alt="DigitAlb" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-white">DigitAlb</h3>
                <span className="bg-white text-[var(--color-primary)] text-[10px] font-extrabold px-2 py-0.5 rounded-md">2× MULTIPLIER</span>
              </div>
              <p className="text-xs text-white/80 mb-3">Add your subscriber ID to double your points — usable in 3 races per season.</p>
              {digitalbMsg && (
                <div className="text-xs font-medium text-white bg-white/20 rounded-lg px-3 py-2 mb-3">{digitalbMsg}</div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="DigitAlb username / card number"
                  value={digitalbId}
                  onChange={e => { setDigitalbId(e.target.value); setDigitalbMsg(""); }}
                  disabled={digitalbLinked}
                  className="flex-1 min-w-0 font-medium text-sm border-none rounded-xl bg-white/95 px-4 py-2.5 text-black placeholder:text-black/40 focus:outline-2 focus:outline-white transition-colors disabled:opacity-60"
                />
                {digitalbLinked ? (
                  <div className="flex items-center gap-1.5 text-white text-sm font-semibold shrink-0">
                    <CheckCircle2 size={16} />
                    Linked — {digitalbUsesLeft} uses left
                  </div>
                ) : (
                  <button
                    disabled={digitalbLoading || digitalbId.trim().length < 3}
                    onClick={async () => {
                      setDigitalbLoading(true);
                      setDigitalbMsg("");
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) return;
                        const res = await fetch("/api/digitalb", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ usernameOrSc: digitalbId.trim() }),
                        });
                        const json = await res.json();
                        if (json.success) {
                          setDigitalbLinked(true);
                          setDigitalbUsesLeft(json.digitalbUsesLeft);
                          setDigitalbMsg("");
                        } else {
                          setDigitalbMsg(json.message || "Verification failed");
                        }
                      } catch {
                        setDigitalbMsg("Network error");
                      } finally {
                        setDigitalbLoading(false);
                      }
                    }}
                    className="shrink-0 bg-white text-[var(--color-primary)] font-bold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {digitalbLoading ? <Loader2 size={14} className="animate-spin" /> : <Tv size={14} />}
                    {digitalbLoading ? "Verifying..." : "Verify"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-primary)]/5 transition-colors text-left group">
          <LogOut size={18} className="text-[var(--color-primary)]" />
          <span className="flex-1 text-sm font-semibold text-[var(--color-primary)]">Log Out</span>
          <ChevronRight size={16} className="text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
