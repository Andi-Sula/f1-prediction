"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Pencil,
  UserCheck,
  UserX,
  X,
  Check,
  Mail,
  Star,
  Hash,
  CalendarDays,
  Shield,
  ShieldCheck,
  Crown,
  MapPin,
  Phone,
  AtSign,
  Eye,
  Globe,
  Loader2,
  Download,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import CustomSelect from "@/components/CustomSelect";

interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  address: string;
  birthday: string | null;
  telephone: string | null;
  authProvider: string;
  points: number;
  rank: number | null;
  predictions: number;
  status: "active" | "inactive" | "pending";
  role: "user" | "admin";
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ status: "active" as User["status"], role: "user" as User["role"] });
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminFetch("/api/admin/users");
      setUsers(data.users || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.surname.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ status: user.status, role: user.role });
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: editForm.status, role: editForm.role }),
      });
      await fetchUsers();
      setEditUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await adminFetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus as User["status"] } : u));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await adminFetch(`/api/admin/users/${user.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole as User["role"] } : u));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const adminCount = users.filter(u => u.role === "admin").length;

  const exportUsers = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/users/export", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `f1_users_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export users");
    }
  };

  const authProviderLabel = (provider: string) => {
    switch (provider) {
      case "google": return { label: "Google", color: "text-blue-400" };
      case "apple": return { label: "Apple", color: "text-gray-300" };
      default: return { label: "Email", color: "text-[var(--color-text-secondary)]" };
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
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">User Management</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button onClick={exportUsers} className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-all">
            <Download size={16} />
            Export Emails
          </button>
          <div className="flex items-center gap-1.5 text-[var(--color-primary)]">
            <ShieldCheck size={14} />
            <span className="font-bold">{adminCount} admin{adminCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--color-green)]">
            <UserCheck size={14} />
            <span className="font-bold">{users.filter(u => u.status === "active").length} active</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <UserX size={14} />
            <span className="font-bold">{users.filter(u => u.status === "inactive").length} inactive</span>
          </div>
        </div>
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
          placeholder="Search users by name, username, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        />
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditUser(null)}>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Users size={18} className="text-[var(--color-primary)]" />
                Edit User
              </h3>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Status</label>
                <CustomSelect
                  value={editForm.status}
                  onChange={v => setEditForm({ ...editForm, status: v as User["status"] })}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Role</label>
                <CustomSelect
                  value={editForm.role}
                  onChange={v => setEditForm({ ...editForm, role: v as User["role"] })}
                  options={[
                    { value: "user", label: "User" },
                    { value: "admin", label: "Admin" },
                  ]}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditUser(null)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] rounded-xl text-sm font-bold hover:bg-white/[0.02] transition-all">
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

      {/* View User Details Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setViewUser(null)}>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-lg space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Eye size={18} className="text-[var(--color-primary)]" />
                User Details
              </h3>
              <button onClick={() => setViewUser(null)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-background)] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-[var(--color-background)] rounded-xl p-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-extrabold ${viewUser.role === "admin" ? "bg-[var(--color-gold)]" : "bg-[var(--color-primary)]"}`}>
                {viewUser.role === "admin" ? <Crown size={20} /> : (viewUser.name[0] + viewUser.surname[0])}
              </div>
              <div>
                <div className="font-extrabold text-lg">{viewUser.name} {viewUser.surname}</div>
                <div className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <AtSign size={12} /> {viewUser.username}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={<Mail size={14} />} label="Email" value={viewUser.email} />
              <DetailItem icon={<MapPin size={14} />} label="Address" value={viewUser.address || "Not provided"} />
              <DetailItem icon={<Phone size={14} />} label="Telephone" value={viewUser.telephone || "Not provided"} />
              <DetailItem icon={<CalendarDays size={14} />} label="Birthday" value={viewUser.birthday || "Not provided"} />
              <DetailItem icon={<Globe size={14} />} label="Auth Provider" value={authProviderLabel(viewUser.authProvider).label} />
              <DetailItem icon={<CalendarDays size={14} />} label="Joined" value={viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString() : "Unknown"} />
              <DetailItem icon={<Star size={14} />} label="Points" value={String(viewUser.points || 0)} />
              <DetailItem icon={<Hash size={14} />} label="Rank" value={viewUser.rank ? `#${viewUser.rank}` : "Unranked"} />
            </div>

            <button onClick={() => setViewUser(null)} className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] rounded-xl text-sm font-bold hover:bg-white/[0.02] transition-all">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Username</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Auth</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Points</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Joined</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0 ${user.role === "admin" ? "bg-[var(--color-gold)]" : "bg-[var(--color-primary)]"}`}>
                      {user.role === "admin" ? <Crown size={14} /> : (user.name[0] + user.surname[0])}
                    </div>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        {user.name} {user.surname}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-mono text-[var(--color-text-secondary)]">@{user.username}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    user.role === "admin"
                      ? "bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20"
                      : "bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                  }`}>
                    {user.role === "admin" ? <ShieldCheck size={10} /> : <Shield size={10} />}
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold ${authProviderLabel(user.authProvider).color}`}>
                    {authProviderLabel(user.authProvider).label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <Star size={12} className="text-[var(--color-gold)]" /> {user.points || 0}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    user.status === "active"
                      ? "bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/20"
                      : user.status === "pending"
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : "bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)] border border-[var(--color-text-secondary)]/20"
                  }`}>
                    {user.status === "active" ? <UserCheck size={10} /> : <UserX size={10} />}
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-sm font-mono text-[var(--color-text-secondary)]">
                    <CalendarDays size={12} /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewUser(user)} className="w-8 h-8 rounded-lg hover:bg-blue-500/10 flex items-center justify-center transition-colors" title="View Details">
                      <Eye size={14} className="text-blue-400" />
                    </button>
                    <button onClick={() => openEdit(user)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title="Edit">
                      <Pencil size={14} className="text-[var(--color-primary)]" />
                    </button>
                    <button onClick={() => toggleRole(user)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-gold)]/10 flex items-center justify-center transition-colors" title={user.role === "admin" ? "Remove Admin" : "Make Admin"}>
                      {user.role === "admin" ? <Shield size={14} className="text-[var(--color-text-secondary)]" /> : <ShieldCheck size={14} className="text-[var(--color-gold)]" />}
                    </button>
                    <button onClick={() => toggleStatus(user)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors" title={user.status === "active" ? "Deactivate" : "Activate"}>
                      {user.status === "active" ? <UserX size={14} className="text-[var(--color-text-secondary)]" /> : <UserCheck size={14} className="text-[var(--color-green)]" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--color-background)] rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold break-words">{value}</div>
    </div>
  );
}
