"use client";

import React, { useEffect, useRef, useState } from "react";
import { Playfair_Display } from "next/font/google";
import AvatarCropModal from "@/components/AvatarCropModal";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
    return (
        <div className={`fixed top-24 right-8 z-[100] px-7 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-bold transition-all ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
            {type === "success"
                ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            }
            {message}
        </div>
    );
}

// ─── Champ texte réutilisable ─────────────────────────────────────────────────

function Field({
    label, value, onChange, type = "text", placeholder = "", disabled = false
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
    // Profil
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Mot de passe
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Chargement initial du profil
    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                setName(data.name || "");
                setEmail(data.email || "");
                setPhone(data.phone || "");
                setAge(data.age !== null && data.age !== undefined ? String(data.age) : "");
                setGender(data.gender || "");
                setAvatar(data.avatar || null);
            })
            .finally(() => setLoadingProfile(false));
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCropConfirm = async (blob: Blob) => {
        setCropSrc(null);
        setIsUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
            const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
            const data = await res.json();
            if (data.success) setAvatar(data.avatarUrl);
            else showToast(data.error || "Erreur upload avatar.", "error");
        } finally { setIsUploadingAvatar(false); }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            await fetch("/api/user/avatar", { method: "DELETE" });
            setAvatar(null);
        } finally { setIsUploadingAvatar(false); }
    };

    // Sauvegarder le profil
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phone.trim(),
                    age: age.trim() ? Number(age) : null,
                    gender: gender.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) showToast("Profil mis à jour avec succès !", "success");
            else showToast(data.error || "Erreur lors de la mise à jour.", "error");
        } catch {
            showToast("Erreur réseau.", "error");
        } finally {
            setSavingProfile(false);
        }
    };

    // Changer le mot de passe
    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("Les mots de passe ne correspondent pas.", "error");
            return;
        }
        if (newPassword.length < 6) {
            showToast("Le nouveau mot de passe doit faire au moins 6 caractères.", "error");
            return;
        }
        setSavingPassword(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "password", currentPassword, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Mot de passe modifié avec succès !", "success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                showToast(data.error || "Erreur.", "error");
            }
        } catch {
            showToast("Erreur réseau.", "error");
        } finally {
            setSavingPassword(false);
        }
    };

    const passwordInput = (
        label: string,
        value: string,
        setter: (v: string) => void,
        show: boolean,
        setShow: (v: boolean) => void,
        placeholder: string
    ) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</label>
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-6 py-4 pr-14 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 transition"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                    {show
                        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    }
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-12 lg:p-16 space-y-10 relative">
            {toast && <Toast message={toast.message} type={toast.type} />}
            {cropSrc && (
                <AvatarCropModal
                    src={cropSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={() => setCropSrc(null)}
                />
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* Header */}
            <header className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Configuration</p>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white`}>
                    Paramètres
                </h1>
                <p className="text-lg text-slate-500 font-light max-w-xl">
                    Gérez vos informations personnelles et votre sécurité.
                </p>
            </header>

            {/* Avatar */}
            <div className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm max-w-sm">
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-[#bca086] flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden">
                        {avatar
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                            : <span>GA</span>
                        }
                    </div>
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#bca086] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#a8896f] transition-all active:scale-95 disabled:opacity-50 z-10">
                        {isUploadingAvatar
                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        }
                    </button>
                    {avatar && (
                        <button type="button" onClick={handleRemoveAvatar} disabled={isUploadingAvatar}
                            className="absolute -bottom-2 -left-2 w-8 h-8 bg-rose-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 z-10">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    )}
                </div>
                <div>
                    <p className="font-black text-slate-800 dark:text-white text-sm">{name || "Administrateur"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Super Admin</p>
                    <p className="text-xs text-slate-400 mt-2">Photo ou logo personnalisé</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-5xl">

                {/* ─── Carte Profil ─── */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#bca086]/10 text-[#bca086] flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-white text-base">Informations personnelles</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Téléphone, âge et genre</p>
                        </div>
                    </div>

                    {loadingProfile ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                                    <div className="h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            {/* Lecture seule */}
                            <Field label="Nom" value={name} onChange={setName} placeholder="Nom de l'admin" disabled />
                            <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" disabled />

                            {/* Éditables */}
                            <Field
                                label="Numéro de téléphone"
                                value={phone}
                                onChange={setPhone}
                                type="tel"
                                placeholder="+33 6 00 00 00 00"
                            />
                            <Field
                                label="Âge"
                                value={age}
                                onChange={setAge}
                                type="number"
                                placeholder="Ex : 35"
                            />

                            {/* Genre */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Genre</label>
                                <select
                                    value={gender}
                                    onChange={e => setGender(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white transition appearance-none cursor-pointer"
                                >
                                    <option value="">Non précisé</option>
                                    <option value="Homme">Homme</option>
                                    <option value="Femme">Femme</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className={`w-full py-4 bg-[#bca086] text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl shadow-xl shadow-[#bca086]/20 flex items-center justify-center gap-3 transition-all ${savingProfile ? "opacity-70 scale-95 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"}`}
                            >
                                {savingProfile && <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24" />}
                                {savingProfile ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </form>
                    )}
                </div>

                {/* ─── Carte Mot de passe ─── */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-white text-base">Sécurité</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Modifier le mot de passe</p>
                        </div>
                    </div>

                    <form onSubmit={handleSavePassword} className="space-y-5">
                        {passwordInput("Mot de passe actuel", currentPassword, setCurrentPassword, showCurrent, setShowCurrent, "••••••••")}
                        {passwordInput("Nouveau mot de passe", newPassword, setNewPassword, showNew, setShowNew, "Min. 6 caractères")}
                        {passwordInput("Confirmer le mot de passe", confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, "Répétez le nouveau mot de passe")}

                        {/* Indicateur de force */}
                        {newPassword.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                            newPassword.length >= i * 3
                                                ? i <= 1 ? "bg-red-400"
                                                : i <= 2 ? "bg-orange-400"
                                                : i <= 3 ? "bg-yellow-400"
                                                : "bg-emerald-400"
                                                : "bg-slate-100 dark:bg-zinc-800"
                                        }`} />
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {newPassword.length < 4 ? "Trop court" : newPassword.length < 7 ? "Faible" : newPassword.length < 10 ? "Moyen" : "Fort"}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                            className={`w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all ${savingPassword || !currentPassword || !newPassword || !confirmPassword ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95 shadow-xl"}`}
                        >
                            {savingPassword && <svg className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />}
                            {savingPassword ? "Modification..." : "Changer le mot de passe"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
