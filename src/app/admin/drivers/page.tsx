"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Car,
  Plus,
  Pencil,
  X,
  Check,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Search,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

const COUNTRIES = [
  { code: "NL", name: "Netherlands" },
  { code: "GB", name: "United Kingdom" },
  { code: "ES", name: "Spain" },
  { code: "MC", name: "Monaco" },
  { code: "MX", name: "Mexico" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "FI", name: "Finland" },
  { code: "CA", name: "Canada" },
  { code: "TH", name: "Thailand" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "US", name: "United States" },
  { code: "DK", name: "Denmark" },
  { code: "IT", name: "Italy" },
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brazil" },
  { code: "NZ", name: "New Zealand" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "PL", name: "Poland" },
  { code: "IE", name: "Ireland" },
];

function FlagImg({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = COUNTRIES.find(c => c.code === value);
  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Origin</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => { setOpen(!open); setFilter(""); }}
          className="w-full flex items-center justify-between bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-left cursor-pointer hover:border-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        >
          <span className={selected ? "text-[var(--color-text)] flex items-center gap-2" : "text-[var(--color-text-secondary)]"}>
            {selected ? <><FlagImg code={selected.code} size={20} /> {selected.name}</> : "Select country..."}
          </span>
          <ChevronDown size={16} className={`text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl shadow-black/20 overflow-hidden">
            <div className="p-2 border-b border-[var(--color-border)]">
              <input
                autoFocus
                placeholder="Search country..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                  !value ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/40"
                }`}
              >
                No origin
              </button>
              {filtered.map(c => {
                const active = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { onChange(c.code); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                      active
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                        : "text-[var(--color-text)] hover:bg-[var(--color-border)]/40"
                    }`}
                  >
                    <FlagImg code={c.code} size={20} />
                    <span className="flex-1 truncate">{c.name}</span>
                    {active && <Check size={14} className="text-[var(--color-primary)] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Driver {
  id: string;
  code: string;
  name: string;
  team: string;
  number: number;
  active: boolean;
  origin: string | null;
  created_at: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState({ code: "", name: "", team: "", number: "", origin: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
    setForm({ code: "", name: "", team: "", number: "", origin: "" });
    setShowForm(true);
  };

  const openEdit = (driver: Driver) => {
    setEditDriver(driver);
    setForm({ code: driver.code || "", name: driver.name, team: driver.team, number: String(driver.number), origin: driver.origin || "" });
    setShowForm(true);
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
        origin: form.origin || null,
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

  const handleDelete = async (driver: Driver) => {
    if (!confirm(`Delete ${driver.name}? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/admin/drivers/${driver.id}`, { method: "DELETE" });
      setDrivers(drivers.filter(d => d.id !== driver.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
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
        <button onClick={openAdd} className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-all">
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
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
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Car size={18} className="text-[var(--color-primary)]" />
                {editDriver ? "Edit Driver" : "Add Driver"}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Full Name</label>
              <input placeholder="e.g. Max Verstappen" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Code</label>
                <input placeholder="e.g. VER" maxLength={3} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Team</label>
                <input placeholder="e.g. Red Bull Racing" value={form.team} onChange={e => setForm({ ...form, team: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Number</label>
                <input type="number" placeholder="e.g. 1" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
              </div>
            </div>

            {/* Origin / Country */}
            <CountrySelect
              value={form.origin}
              onChange={(v) => setForm({ ...form, origin: v })}
            />

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
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Driver</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Team</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Origin</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((driver) => (
              <tr key={driver.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02] transition-colors ${!driver.active ? "opacity-50" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {driver.origin ? (
                      <FlagImg code={driver.origin} size={28} />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
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
                  {driver.origin ? (
                    <span className="text-sm flex items-center gap-1.5"><FlagImg code={driver.origin} size={18} /> {COUNTRIES.find(c => c.code === driver.origin)?.name || driver.origin}</span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-secondary)] italic">Not set</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    driver.active
                      ? "bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/20"
                      : "bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)] border border-[var(--color-text-secondary)]/20"
                  }`}>
                    {driver.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(driver)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title="Edit">
                      <Pencil size={14} className="text-[var(--color-primary)]" />
                    </button>
                    <button onClick={() => toggleActive(driver)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title={driver.active ? "Deactivate" : "Activate"}>
                      {driver.active ? <ToggleRight size={16} className="text-[var(--color-green)]" /> : <ToggleLeft size={16} className="text-[var(--color-text-secondary)]" />}
                    </button>
                    <button onClick={() => handleDelete(driver)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors" title="Delete">
                      <Trash2 size={14} className="text-[var(--color-text-secondary)] hover:text-red-400" />
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
