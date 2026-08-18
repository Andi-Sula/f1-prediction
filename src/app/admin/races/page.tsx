"use client";
import { useEffect, useRef, useState } from "react";
import {
  FlagTriangleRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  CalendarDays,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import CustomSelect from "@/components/CustomSelect";

interface Race {
  id: string;
  name: string;
  date: string;
  race_time: string | null;
  qualifying_time: string | null;
  best_lap: string | null;
  status: string;
  season: number;
  visible: boolean;
}

const formatBestLapInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 7);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    const minutes = digits.slice(0, 1);
    const seconds = digits.slice(1, Math.min(3, digits.length));
    const milliseconds = digits.slice(3);
    return `${minutes}:${seconds}${milliseconds ? `.${milliseconds}` : ""}`;
  }

  const minutes = digits.slice(0, digits.length - 5);
  const seconds = digits.slice(digits.length - 5, digits.length - 3);
  const milliseconds = digits.slice(digits.length - 3);

  return `${minutes}:${seconds}.${milliseconds}`;
};

export default function RacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRace, setEditRace] = useState<Race | null>(null);
  const [form, setForm] = useState({ name: "", date: "", qualifying_time: "", status: "upcoming", best_lap: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const didFetch = useRef(false);

  const fetchRaces = async () => {
    try {
      const data = await adminFetch("/api/admin/races");
      setRaces(data.races || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load races");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchRaces();
  });

  const openAdd = () => {
    setEditRace(null);
    setFormError("");
    setForm({ name: "", date: "", qualifying_time: "", status: "upcoming", best_lap: "" });
    setShowForm(true);
  };

  const openEdit = (race: Race) => {
    setEditRace(race);
    setFormError("");
    // Convert UTC to local datetime-local format for the input
    const toLocalInput = (utc: string | null) => {
      if (!utc) return "";
      const d = new Date(utc);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    };
    setForm({
      name: race.name,
      date: race.date,
      qualifying_time: toLocalInput(race.qualifying_time),
      status: race.status,
      best_lap: race.best_lap || "",
    });
    setShowForm(true);
  };

  const handleBestLapChange = (value: string) => {
    setForm({ ...form, best_lap: formatBestLapInput(value) });
  };

  const handleSave = async () => {
    if (!form.name || !form.date) return;
    setFormError("");

    // Convert local datetime-local values to ISO with timezone offset
    const toISO = (v: string) => {
      if (!v) return null;
      return new Date(v).toISOString();
    };

    setSaving(true);
    try {
      const body = {
        name: form.name,
        date: form.date,
        qualifying_time: toISO(form.qualifying_time),
        status: form.status,
        best_lap: form.best_lap || null,
      };
      if (editRace) {
        await adminFetch(`/api/admin/races/${editRace.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/api/admin/races", { method: "POST", body: JSON.stringify(body) });
      }
      await fetchRaces();
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this race? This cannot be undone.")) return;
    try {
      await adminFetch(`/api/admin/races/${id}`, { method: "DELETE" });
      setRaces(races.filter(r => r.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const toggleVisibility = async (race: Race) => {
    try {
      await adminFetch(`/api/admin/races/${race.id}`, {
        method: "PUT",
        body: JSON.stringify({ visible: !race.visible }),
      });
      setRaces(races.map(r => r.id === race.id ? { ...r, visible: !r.visible } : r));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const statusStyle = (status: string) =>
    status === "active" || status === "qualifying" || status === "race_day"
      ? "bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/20"
      : status === "completed"
      ? "bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)] border border-[var(--color-text-secondary)]/20"
      : "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Race Calendar</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage the F1 race schedule with qualifying times</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-all">
          <Plus size={16} />
          Add Race
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <FlagTriangleRight size={18} className="text-[var(--color-primary)]" />
                {editRace ? "Edit Race" : "Add Race"}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Race Name</label>
              <input placeholder="e.g. Monaco Grand Prix" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                Qualifying Date & Time
              </label>
              <input type="datetime-local" value={form.qualifying_time} onChange={e => setForm({ ...form, qualifying_time: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                Race Date
              </label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Status</label>
              <CustomSelect
                value={form.status}
                onChange={v => setForm({ ...form, status: v })}
                options={[
                  { value: "upcoming", label: "Upcoming" },
                  { value: "qualifying", label: "Qualifying" },
                  { value: "race_day", label: "Race Day" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                Best Lap Time (M:SS.mmm)
              </label>
              <input type="text" inputMode="numeric" placeholder="1:23.456" value={form.best_lap} onChange={e => handleBestLapChange(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] font-mono placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] rounded-xl text-sm font-bold hover:bg-white/[0.02] transition-all">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Race</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Date & Time</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => {
              return (
              <tr key={race.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02] transition-colors ${!race.visible ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <FlagTriangleRight size={14} className="text-[var(--color-primary)] shrink-0" />
                    <div className="text-sm font-semibold">{race.name}</div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {race.qualifying_time ? (
                    <div className="flex items-center gap-2 text-sm font-mono text-[var(--color-text-secondary)]">
                      <CalendarDays size={12} />
                      {new Date(race.qualifying_time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      <span className="text-[var(--color-text-secondary)]/50">·</span>
                      {new Date(race.qualifying_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-text-secondary)] italic">Not set</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${statusStyle(race.status)}`}>
                    {race.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleVisibility(race)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title={race.visible ? "Deactivate" : "Activate"}>
                      {race.visible ? <ToggleRight size={16} className="text-[var(--color-green)]" /> : <ToggleLeft size={16} className="text-[var(--color-text-secondary)]" />}
                    </button>
                    <button onClick={() => openEdit(race)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title="Edit">
                      <Pencil size={14} className="text-[var(--color-primary)]" />
                    </button>
                    <button onClick={() => handleDelete(race.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors" title="Delete">
                      <Trash2 size={14} className="text-[var(--color-text-secondary)] hover:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {races.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                  No races found. Click &quot;Add Race&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
