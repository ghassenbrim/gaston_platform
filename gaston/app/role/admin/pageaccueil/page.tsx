"use client";

import React, { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";
import type { PortfolioItem, ServiceItem, AboutContent, ContactContent } from "@/backend/admin/homepage";
import ImagePicker from "./ImagePicker";
import { PACKS_BY_CATEGORY, getMinPriceLabel } from "@/lib/packs";

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

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = "", textarea = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean;
}) {
    const cls = "w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 transition text-sm";
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</label>
            {textarea
                ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${cls} resize-none`} />
                : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
            }
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, onSave, saving }: {
    title: string; icon: React.ReactNode; children: React.ReactNode; onSave: () => void; saving: boolean;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#bca086]/10 text-[#bca086] flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    <h2 className="font-black text-slate-900 dark:text-white text-base">{title}</h2>
                </div>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className={`px-6 py-2.5 bg-[#bca086] text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-xl shadow-lg shadow-[#bca086]/20 flex items-center gap-2 transition-all ${saving ? "opacity-70 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
                >
                    {saving && <svg className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24" />}
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shrink-0 whitespace-nowrap ${active
                ? "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
        >
            {children}
        </button>
    );
}

const CATEGORIES = ["Mariage", "Anniversaire", "Immobilier", "Evenement", "Autre"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PageAccueilAdmin() {
    const [tab, setTab] = useState<"portfolio" | "services" | "propos" | "contact">("portfolio");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Portfolio
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [savingPortfolio, setSavingPortfolio] = useState(false);

    // Services
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [savingServices, setSavingServices] = useState(false);

    // About
    const [about, setAbout] = useState<AboutContent>({
        bio1: "", bio2: "", image: "", stats: [
            { val: "", label: "" }, { val: "", label: "" }, { val: "", label: "" }
        ]
    });
    const [savingAbout, setSavingAbout] = useState(false);

    // Contact
    const [contact, setContact] = useState<ContactContent>({ email: "", instagram: "", facebook: "", linkedin: "" });
    const [savingContact, setSavingContact] = useState(false);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        fetch("/api/admin/homepage")
            .then(res => res.json())
            .then(data => {
                setPortfolio(data.portfolio ?? []);
                setServices(data.services ?? []);
                setAbout(data.about ?? { bio1: "", bio2: "", image: "", stats: [] });
                setContact(data.contact ?? { email: "", instagram: "", behance: "", linkedin: "" });
            })
            .catch(() => showToast("Erreur lors du chargement.", "error"))
            .finally(() => setLoading(false));
    }, []);

    const save = async (section: "portfolio" | "services" | "about" | "contact", value: unknown, setSaving: (v: boolean) => void) => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/homepage", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [section]: value }),
            });
            const data = await res.json();
            if (data.success) showToast("Sauvegardé avec succès !", "success");
            else showToast(data.error || "Erreur lors de la sauvegarde.", "error");
        } catch {
            showToast("Erreur réseau.", "error");
        } finally {
            setSaving(false);
        }
    };

    const updatePortfolioItem = (idx: number, field: keyof PortfolioItem, val: string | number) => {
        setPortfolio(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    };

    const addPortfolioItem = () => {
        setPortfolio(prev => [...prev, { id: Date.now(), title: "", category: "PORTRAITS", image: "" }]);
    };

    const removePortfolioItem = (idx: number) => {
        setPortfolio(prev => prev.filter((_, i) => i !== idx));
    };

    const updateServiceItem = (idx: number, field: keyof ServiceItem, val: string) => {
        setServices(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    };

    const addServiceItem = () => {
        setServices(prev => [...prev, { title: "", description: "", price: "" }]);
    };

    const removeServiceItem = (idx: number) => {
        setServices(prev => prev.filter((_, i) => i !== idx));
    };

    const updateStat = (idx: number, field: "val" | "label", val: string) => {
        setAbout(prev => ({
            ...prev,
            stats: prev.stats.map((s, i) => i === idx ? { ...s, [field]: val } : s),
        }));
    };

    if (loading) {
        return (
            <div className="p-12 space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-[2rem] bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 lg:p-14 space-y-8 relative">
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Header */}
            <header className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Contenu</p>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white`}>
                    Page d&apos;accueil
                </h1>
                <p className="text-base text-slate-500 font-light max-w-xl">
                    Modifiez le contenu visible par vos visiteurs : portfolio, services, à propos et contact.
                </p>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-white/5 w-fit">
                <Tab active={tab === "portfolio"} onClick={() => setTab("portfolio")}>Portfolio</Tab>
                <Tab active={tab === "services"} onClick={() => setTab("services")}>Services</Tab>
                <Tab active={tab === "propos"} onClick={() => setTab("propos")}>À Propos</Tab>
                <Tab active={tab === "contact"} onClick={() => setTab("contact")}>Contact</Tab>
            </div>

            {/* ── Portfolio Tab ── */}
            {tab === "portfolio" && (
                <SectionCard
                    title="Photos du Portfolio"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    onSave={() => save("portfolio", portfolio, setSavingPortfolio)}
                    saving={savingPortfolio}
                >
                    <div className="space-y-6">
                        {portfolio.map((item, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#bca086]">Photo {idx + 1}</span>
                                    <button
                                        onClick={() => removePortfolioItem(idx)}
                                        className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-wide transition"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field
                                        label="Titre"
                                        value={item.title}
                                        onChange={v => updatePortfolioItem(idx, "title", v)}
                                        placeholder="Ex: Élégance Sylvestre"
                                    />
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Catégorie</label>
                                        <select
                                            value={item.category}
                                            onChange={e => updatePortfolioItem(idx, "category", e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white transition text-sm appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <ImagePicker
                                    label="Image"
                                    value={item.image}
                                    onChange={v => updatePortfolioItem(idx, "image", v)}
                                />
                            </div>
                        ))}
                        <button
                            onClick={addPortfolioItem}
                            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:border-[#bca086] hover:text-[#bca086] transition-all"
                        >
                            + Ajouter une photo
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* ── Services Tab ── */}
            {tab === "services" && (
                <SectionCard
                    title="Services & Tarifs"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    onSave={() => save("services", services, setSavingServices)}
                    saving={savingServices}
                >
                    <div className="space-y-6">
                        {services.map((svc, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#bca086]">Service {idx + 1}</span>
                                    <button
                                        onClick={() => removeServiceItem(idx)}
                                        className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-wide transition"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nom du service</label>
                                        <select
                                            value={svc.title}
                                            onChange={e => {
                                                const cat = e.target.value;
                                                const minPrice = getMinPriceLabel(cat);
                                                setServices(prev => prev.map((s, i) => i === idx ? { ...s, title: cat, price: minPrice || s.price } : s));
                                            }}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white transition text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">— Choisir une catégorie —</option>
                                            {Object.keys(PACKS_BY_CATEGORY).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Field
                                        label="Prix (auto-rempli, modifiable)"
                                        value={svc.price}
                                        onChange={v => updateServiceItem(idx, "price", v)}
                                        placeholder="Ex: À partir de 400 DT"
                                    />
                                </div>
                                <Field
                                    label="Description"
                                    value={svc.description}
                                    onChange={v => updateServiceItem(idx, "description", v)}
                                    placeholder="Décrivez le service..."
                                    textarea
                                />
                            </div>
                        ))}
                        <button
                            onClick={addServiceItem}
                            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:border-[#bca086] hover:text-[#bca086] transition-all"
                        >
                            + Ajouter un service
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* ── À Propos Tab ── */}
            {tab === "propos" && (
                <SectionCard
                    title="Section À Propos"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    onSave={() => save("about", about, setSavingAbout)}
                    saving={savingAbout}
                >
                    <ImagePicker
                        label="Photo du photographe"
                        value={about.image}
                        onChange={v => setAbout(prev => ({ ...prev, image: v }))}
                    />
                    <Field
                        label="Texte biographie — paragraphe 1"
                        value={about.bio1}
                        onChange={v => setAbout(prev => ({ ...prev, bio1: v }))}
                        placeholder="Depuis plus d'une décennie..."
                        textarea
                    />
                    <Field
                        label="Texte biographie — paragraphe 2"
                        value={about.bio2}
                        onChange={v => setAbout(prev => ({ ...prev, bio2: v }))}
                        placeholder="Ma philosophie..."
                        textarea
                    />

                    <div className="pt-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Statistiques</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{about.stats?.length ?? 0} / 4 statistiques</p>
                            </div>
                            {(about.stats?.length ?? 0) < 4 && (
                                <button
                                    type="button"
                                    onClick={() => setAbout(prev => ({ ...prev, stats: [...(prev.stats ?? []), { val: "", label: "" }] }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#bca086]/10 text-[#bca086] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#bca086] hover:text-white transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Ajouter
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(about.stats ?? []).map((stat, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#bca086]">Stat {idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAbout(prev => ({ ...prev, stats: prev.stats.filter((_, i) => i !== idx) }))}
                                            className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-wide transition"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                    <Field
                                        label="Valeur"
                                        value={stat.val}
                                        onChange={v => updateStat(idx, "val", v)}
                                        placeholder="Ex: 12+"
                                    />
                                    <Field
                                        label="Libellé"
                                        value={stat.label}
                                        onChange={v => updateStat(idx, "label", v)}
                                        placeholder="Ex: Années d'Art"
                                    />
                                </div>
                            ))}

                            {(about.stats?.length ?? 0) === 0 && (
                                <p className="col-span-2 text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                                    Aucune statistique. Cliquez sur &quot;Ajouter&quot; pour en créer une.
                                </p>
                            )}
                        </div>

                        {(about.stats?.length ?? 0) >= 4 && (
                            <p className="text-[11px] text-[#bca086] font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Maximum atteint (4 statistiques)
                            </p>
                        )}
                    </div>
                </SectionCard>
            )}

            {/* ── Contact Tab ── */}
            {tab === "contact" && (
                <SectionCard
                    title="Liens de Contact"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    onSave={() => save("contact", contact, setSavingContact)}
                    saving={savingContact}
                >
                    <Field
                        label="Adresse email de contact"
                        value={contact.email}
                        onChange={v => setContact(prev => ({ ...prev, email: v }))}
                        placeholder="art@example.com"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                Instagram
                            </label>
                            <input
                                type="text"
                                value={contact.instagram}
                                onChange={e => setContact(prev => ({ ...prev, instagram: e.target.value }))}
                                placeholder="https://instagram.com/..."
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white placeholder:text-slate-300 transition text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                Facebook
                            </label>
                            <input
                                type="text"
                                value={contact.facebook}
                                onChange={e => setContact(prev => ({ ...prev, facebook: e.target.value }))}
                                placeholder="https://facebook.com/..."
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white placeholder:text-slate-300 transition text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                LinkedIn
                            </label>
                            <input
                                type="text"
                                value={contact.linkedin}
                                onChange={e => setContact(prev => ({ ...prev, linkedin: e.target.value }))}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#bca086]/20 font-semibold text-slate-800 dark:text-white placeholder:text-slate-300 transition text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-[#bca086]/5 border border-[#bca086]/10 rounded-2xl">
                        <p className="text-[11px] text-[#bca086] font-bold uppercase tracking-widest mb-1">Aperçu email</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{contact.email || "—"}</p>
                    </div>
                </SectionCard>
            )}

            {/* Preview link */}
            <div className="flex items-center gap-3 pt-2">
                <a
                    href="/role/welcompage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-[0.25em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Voir la page d&apos;accueil
                </a>
                <p className="text-xs text-slate-400 font-medium">Les modifications sont visibles immédiatement après sauvegarde.</p>
            </div>
        </div>
    );
}
