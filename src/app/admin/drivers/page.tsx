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
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "XK", name: "Kosovo" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

function FlagImg({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      alt={code}
      width={size}
      height={size}
      className="inline-block rounded-full object-cover"
      style={{ width: size, height: size }}
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
