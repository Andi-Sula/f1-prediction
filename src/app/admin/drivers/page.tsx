"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Car,
  Plus,
  Pencil,
  X,
  Check,
  Loader2,
  Upload,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface Driver {
  id: string;
  code: string;
  name: string;
  team: string;
  number: number;
  active: boolean;
  image_url: string | null;
  created_at: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState({ code: "", name: "", team: "", number: "", image_url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await adminFetch("/api/admin/drivers");
      setDrivers(data.drivers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const openAdd = () => {
    setEditDriver(null);
    setForm({ code: "", name: "", team: "", number: "", image_url: "" });
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (driver: Driver) => {
    setEditDriver(driver);
    setForm({ code: driver.code || "", name: driver.name, team: driver.team, number: String(driver.number), image_url: driver.image_url || "" });
    setImagePreview(driver.image_url || null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, WebP, or SVG image");
      return;
    }
    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setForm(f => ({ ...f, image_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.team || !form.number) return;
    setSaving(true);
    try {
      const body = {
        code: form.code.toUpperCase(),
        name: form.name,
        team: form.team,
        number: parseInt(form.number, 10),
        image_url: form.image_url || null,
      };
      if (editDriver) {
        await adminFetch(`/api/admin/drivers/${editDriver.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/api/admin/drivers", { method: "POST", body: JSON.stringify(body) });
      }
      await fetchDrivers();
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (driver: Driver) => {
    try {
      await adminFetch(`/api/admin/drivers/${driver.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !driver.active }),
      });
      setDrivers(drivers.map(d => d.id === driver.id ? { ...d, active: !d.active } : d));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.team.toLowerCase().includes(search.toLowerCase()) ||
    String(d.number).includes(search)
  );

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
          <h1 className="text-2xl font-extrabold tracking-tight">Drivers</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {drivers.filter(d => d.active).length} active / {drivers.length} total
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-sm text-sm font-bold hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-all">
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-sm text-sm font-medium">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          placeholder="Search by name, team, or number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm pl-11 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Car size={18} className="text-[var(--color-primary)]" />
                {editDriver ? "Edit Driver" : "Add Driver"}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-sm hover:bg-[var(--color-background)] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Full Name</label>
              <input placeholder="e.g. Max Verstappen" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-sm px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Code</label>
                <input placeholder="e.g. VER" maxLength={3} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-sm px-4 py-3 text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Team</label>
                <input placeholder="e.g. Red Bull Racing" value={form.team} onChange={e => setForm({ ...form, team: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-sm px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Number</label>
                <input type="number" placeholder="e.g. 1" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-sm px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Driver Photo</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="w-16 h-16 rounded-sm border border-[var(--color-border)] overflow-hidden bg-[var(--color-background)] shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-sm border border-dashed border-[var(--color-border)] flex items-center justify-center bg-[var(--color-background)] shrink-0">
                    <ImageIcon size={20} className="text-[var(--color-text-secondary)]" />
                  </div>
                )}
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[var(--color-border)] rounded-sm text-sm font-semibold hover:bg-white/[0.02] transition-all"
                  >
                    <Upload size={14} />
                    Upload Photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleFileChange} className="hidden" />
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">JPEG, PNG, WebP, or SVG. Max 2MB.</p>
                </div>
              </div>
              {/* Or paste URL */}
              <input placeholder="Or paste image URL..." value={form.image_url.startsWith("data:") ? "" : form.image_url}
                onChange={e => { setForm({ ...form, image_url: e.target.value }); setImagePreview(e.target.value || null); }}
                className="w-full mt-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-sm px-4 py-2.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] rounded-sm text-sm font-bold hover:bg-white/[0.02] transition-all">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-white rounded-sm text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Driver</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Team</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Image</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((driver) => (
              <tr key={driver.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02] transition-colors ${!driver.active ? "opacity-50" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {driver.image_url ? (
                      <img src={driver.image_url} alt={driver.name} className="w-9 h-9 rounded-sm object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-sm bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                        <Car size={16} className="text-[var(--color-primary)]" />
                      </div>
                    )}
                    <span className="text-sm font-semibold">{driver.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[var(--color-text-secondary)]">{driver.team}</td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-mono font-bold">{driver.number}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-sm uppercase tracking-wider ${
                    driver.active
                      ? "bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/20"
                      : "bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)] border border-[var(--color-text-secondary)]/20"
                  }`}>
                    {driver.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {driver.image_url ? (
                    <span className="text-[10px] text-[var(--color-green)] font-bold">Uploaded</span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-secondary)] italic">None</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(driver)} className="w-8 h-8 rounded-sm hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title="Edit">
                      <Pencil size={14} className="text-[var(--color-primary)]" />
                    </button>
                    <button onClick={() => toggleActive(driver)} className="w-8 h-8 rounded-sm hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title={driver.active ? "Deactivate" : "Activate"}>
                      {driver.active ? <ToggleRight size={16} className="text-[var(--color-green)]" /> : <ToggleLeft size={16} className="text-[var(--color-text-secondary)]" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                  {search ? "No drivers match your search." : "No drivers found. Click \"Add Driver\" to create one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
