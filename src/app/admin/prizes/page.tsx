"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Award,
  Upload,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
  Trophy,
  Pencil,
  Globe,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface Prize {
  id: string;
  position: number;
  icon_url: string;
  label: string;
  published_icon_url: string | null;
  published_label: string | null;
  active: boolean;
}

const positionTitles = ["1st Place", "2nd Place", "3rd Place"];
const positionColors = ["var(--color-gold)", "var(--color-silver)", "var(--color-bronze)"];

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editPosition, setEditPosition] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [newIconUrl, setNewIconUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPrizes = useCallback(async () => {
    try {
      const data = await adminFetch("/api/admin/prizes");
      setPrizes(data.prizes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load prizes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrizes(); }, [fetchPrizes]);

  const hasUnpublishedChanges = prizes.some(
    (p) => p.label !== p.published_label || p.icon_url !== p.published_icon_url
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, WebP, GIF, or SVG image");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setError("Icon must be smaller than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      setNewIconUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (position: number) => {
    const prize = prizes.find(p => p.position === position);
    setEditPosition(position);
    setNewIconUrl(prize?.icon_url || "");
    setPreview(prize?.icon_url || null);
    setNewLabel(prize?.label || "");
  };

  const handleSave = async () => {
    if (!editPosition) return;
    if (!newLabel.trim()) { setError("Prize name is required"); return; }
    setSaving(true);
    try {
      await adminFetch(`/api/admin/prizes/${editPosition}`, {
        method: "PUT",
        body: JSON.stringify({ icon_url: newIconUrl || null, label: newLabel.trim() }),
      });
      await fetchPrizes();
      setEditPosition(null);
      setPreview(null);
      setNewIconUrl("");
      setNewLabel("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await adminFetch("/api/admin/prizes/publish", { method: "POST" });
      await fetchPrizes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const [discarding, setDiscarding] = useState(false);

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      await adminFetch("/api/admin/prizes", { method: "DELETE" });
      await fetchPrizes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Discard failed");
    } finally {
      setDiscarding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Prizes</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage prizes for the top 3 players — publish to show on homepage</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Prize Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((pos) => {
          const prize = prizes.find(p => p.position === pos);
          return (
            <div key={pos} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 text-center space-y-4">
              <div className="flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${positionColors[pos - 1]}20` }}
                >
                  {prize?.icon_url ? (
                    <img src={prize.icon_url} alt={prize.label} className="w-10 h-10 object-contain" />
                  ) : (
                    <Trophy size={28} style={{ color: positionColors[pos - 1] }} />
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
                  {positionTitles[pos - 1]}
                </div>
                <div className="font-extrabold text-base mt-1" style={{ color: positionColors[pos - 1] }}>
                  {prize?.label || "Not set"}
                </div>
              </div>
              <button
                onClick={() => openEdit(pos)}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-semibold hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all"
              >
                <Pencil size={14} />
                Edit Prize
              </button>
            </div>
          );
        })}
      </div>

      {/* Homepage Preview Section */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Globe size={16} className="text-[var(--color-text-secondary)]" />
            Homepage Preview
          </h3>
          {hasUnpublishedChanges && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
              Unpublished changes
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((pos) => {
            const prize = prizes.find(p => p.position === pos);
            return (
              <div key={pos} className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-md"
                  style={{ backgroundColor: positionColors[pos - 1] }}>
                  {pos}
                </div>
                {prize?.icon_url && (
                  <img src={prize.icon_url} alt="" className="w-8 h-8 object-contain" />
                )}
                <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
                  {positionTitles[pos - 1]}
                </div>
                <div className="text-sm font-semibold leading-snug">
                  {prize?.label || "Not set"}
                </div>
              </div>
            );
          })}
        </div>
        {hasUnpublishedChanges && (
          <div className="pt-2 border-t border-[var(--color-border)] flex gap-3">
            <button
              onClick={handleDiscard}
              disabled={discarding}
              className="flex items-center justify-center gap-2 flex-1 py-3 border border-[var(--color-border)] rounded-xl text-sm font-bold hover:bg-white/[0.02] transition-all disabled:opacity-50"
            >
              {discarding ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              {discarding ? "Discarding..." : "Discard Draft"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center justify-center gap-2 flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              {publishing ? "Publishing..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editPosition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditPosition(null)}>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-sm space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Award size={18} style={{ color: positionColors[editPosition - 1] }} />
                {positionTitles[editPosition - 1]}
              </h3>
              <button onClick={() => setEditPosition(null)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Position label (read-only) */}
            <div className="bg-[var(--color-background)] rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-extrabold"
                style={{ backgroundColor: positionColors[editPosition - 1] }}>
                {editPosition}
              </div>
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">{positionTitles[editPosition - 1]}</span>
            </div>

            {/* Prize name */}
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Prize Name</label>
              <input
                placeholder="e.g. Ferrari Team T-Shirt"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>

            {/* Icon preview */}
            <div className="flex items-center justify-center py-2">
              {preview ? (
                <div className="w-20 h-20 rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-background)] flex items-center justify-center">
                  <img src={preview} alt="Preview" className="w-14 h-14 object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border border-dashed border-[var(--color-border)] flex items-center justify-center bg-[var(--color-background)]">
                  <ImageIcon size={28} className="text-[var(--color-text-secondary)]" />
                </div>
              )}
            </div>

            {/* Upload */}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-3 border border-[var(--color-border)] rounded-xl text-sm font-semibold hover:bg-white/[0.02] transition-all"
              >
                <Upload size={14} />
                Upload Prize Icon
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif" onChange={handleFileChange} className="hidden" />
              <p className="text-[10px] text-[var(--color-text-secondary)] text-center mt-1.5">
                PNG, SVG, or GIF recommended. Max 1MB.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Or paste image URL</label>
              <input
                placeholder="https://..."
                value={newIconUrl.startsWith("data:") ? "" : newIconUrl}
                onChange={e => { setNewIconUrl(e.target.value); setPreview(e.target.value || null); }}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditPosition(null)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] rounded-xl text-sm font-bold hover:bg-white/[0.02] transition-all">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !newLabel.trim()} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
