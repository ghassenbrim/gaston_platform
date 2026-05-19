"use client";

import { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";
import { useRouter } from "next/navigation";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  dateInscription: string;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-24 right-8 z-[300] px-7 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-bold ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
      {type === "success"
        ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
      }
      {message}
    </div>
  );
}

// ─── Modal suppression ────────────────────────────────────────────────────────
function ConfirmModal({ user, onConfirm, onCancel, deleting }: {
  user: User; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-2xl p-8 md:p-10 w-full max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className={`${playfair.className} text-3xl italic text-center text-slate-900 dark:text-white mb-2`}>Supprimer le compte ?</h2>
        <p className="text-center text-slate-500 text-sm font-medium mb-6 leading-relaxed">
          Cette action est <span className="text-red-500 font-bold">irréversible</span>. Toutes les données de <span className="font-bold text-slate-800 dark:text-white">{user.name || user.email}</span> seront supprimées.
        </p>
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#bca086]/10 flex items-center justify-center text-sm font-black text-[#bca086] shrink-0">
            {getInitials(user.name, user.email)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{user.name || "Sans nom"}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting} className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={deleting} className={`flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${deleting ? "opacity-70 cursor-not-allowed" : "hover:bg-red-600 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-200"}`}>
            {deleting && <svg className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24" />}
            {deleting ? "Suppression..." : "Oui, supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panneau détails ──────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5">
      <div className="w-9 h-9 rounded-xl bg-[#bca086]/10 text-[#bca086] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
          {value || <span className="text-slate-300 dark:text-zinc-600 font-medium italic">Non renseigné</span>}
        </p>
      </div>
    </div>
  );
}

function UserDetailPanel({ user, onClose, onDelete }: {
  user: User; onClose: () => void; onDelete: () => void;
}) {
  const router = useRouter();
  const initials = getInitials(user.name, user.email);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-[110] bg-white dark:bg-zinc-900 shadow-2xl border-l border-slate-100 dark:border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Fiche utilisateur</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar + nom */}
          <div className="flex flex-col items-center text-center pt-4 pb-2">
            <div className="w-20 h-20 rounded-[1.5rem] bg-[#bca086] flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-[#bca086]/20 mb-4">
              {initials}
            </div>
            <h2 className={`${playfair.className} text-3xl italic text-slate-900 dark:text-white leading-tight`}>
              {user.name || <span className="text-slate-400 font-medium not-italic text-xl">Sans nom</span>}
            </h2>
            <span className="mt-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
              Compte actif
            </span>
          </div>

          {/* Informations */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-3">Informations</p>

            <DetailRow
              label="Nom complet"
              value={user.name}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
            />
            <DetailRow
              label="E-mail"
              value={user.email}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
            />
            <DetailRow
              label="Téléphone"
              value={user.phone}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>}
            />
            <DetailRow
              label="Âge"
              value={user.age ? `${user.age} ans` : null}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <DetailRow
              label="Genre"
              value={user.gender}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6h.008v.008H6V6z" /></svg>}
            />
            <DetailRow
              label="Membre depuis"
              value={user.dateInscription}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            />
          </div>
        </div>

        {/* Footer — actions */}
        <div className="p-6 border-t border-slate-100 dark:border-white/10 shrink-0 space-y-3">
          {/* Gérer les photos */}
          <button
            onClick={() => router.push(`/role/admin/listuser/${user.id}/photos`)}
            className="w-full py-3.5 rounded-2xl bg-[#bca086]/10 text-[#bca086] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#bca086] hover:text-white transition-all hover:scale-[1.02] active:scale-95 border border-[#bca086]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Gérer les photos
          </button>
          {/* Supprimer */}
          <button
            onClick={onDelete}
            className="w-full py-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all hover:scale-[1.02] active:scale-95 border border-red-100 dark:border-red-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer ce compte
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ListUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/listuser", { cache: "no-store" });
      if (!response.ok) throw new Error("Erreur de chargement");
      const data: User[] = await response.json();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/listuser", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== toDelete.id));
        setSelectedUser(null);
        showToast("Compte supprimé avec succès.", "success");
      } else {
        showToast(data.error || "Erreur lors de la suppression.", "error");
      }
    } catch {
      showToast("Erreur réseau.", "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="p-6 md:p-12 lg:p-16 space-y-10">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Panneau détails */}
      {selectedUser && !toDelete && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={() => { setToDelete(selectedUser); setSelectedUser(null); }}
        />
      )}

      {/* Modal suppression */}
      {toDelete && (
        <ConfirmModal
          user={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          deleting={deleting}
        />
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Administration</p>
          <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
            Utilisateurs
          </h1>
          <p className="text-lg text-slate-500 font-light leading-relaxed">
            {users.length} compte{users.length !== 1 ? "s" : ""} enregistré{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm self-start md:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} actif{users.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[640px]">
        {/* Header */}
        <div className="grid grid-cols-12 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
          <div className="col-span-4">Utilisateur</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Téléphone</div>
          <div className="col-span-2">Inscrit le</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Lignes */}
        {users.map((user) => {
          const initials = getInitials(user.name, user.email);
          return (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="grid grid-cols-12 px-8 py-5 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors group items-center cursor-pointer"
            >
              {/* Avatar + Name */}
              <div className="col-span-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#bca086]/10 flex items-center justify-center text-sm font-black text-[#bca086] shrink-0 group-hover:bg-[#bca086]/20 transition-colors">
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {user.name || <span className="italic text-slate-400 font-medium">Sans nom</span>}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Compte actif
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="col-span-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>

              {/* Téléphone */}
              <div className="col-span-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {user.phone || <span className="text-slate-300 dark:text-zinc-700 italic">—</span>}
                </p>
              </div>

              {/* Date */}
              <div className="col-span-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.dateInscription}</p>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setToDelete(user)}
                  className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty */}
        {!isLoading && users.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0Z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun utilisateur enregistré</p>
          </div>
        )}

        {isLoading && (
          <div className="py-24 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
