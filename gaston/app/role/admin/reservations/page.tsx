"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Playfair_Display } from "next/font/google";

const LocationMapView = dynamic(() => import("@/components/LocationMapView"), { ssr: false });

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

type Status = "En attente" | "Confirmée" | "Annulée";

interface Reservation {
    id: string;
    client: string;
    email: string;
    service: string;
    date: string;
    heure: string;
    lieu: string;
    latitude?: number | null;
    longitude?: number | null;
    status: Status;
    message: string;
    team: string[];
    teamIds: string[];
}

interface EmployeeOption {
    id: string;
    name: string;
    role: string;
    initiales: string;
}

const STATUS_STYLES: Record<Status, string> = {
    "En attente": "bg-amber-50 text-amber-600 border-amber-200",
    "Confirmée": "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "Annulée": "bg-rose-50 text-rose-500 border-rose-200",
};

const FILTERS: (Status | "Toutes")[] = ["Toutes", "En attente", "Confirmée", "Annulée"];

// ─── Upload contrat ───────────────────────────────────────────────────────────
async function uploadContractFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Upload échoué");
    return data.path as string;
}

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [filter, setFilter] = useState<Status | "Toutes">("Toutes");
    const [selected, setSelected] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);

    // Team picker
    const [showTeamPicker, setShowTeamPicker] = useState(false);
    const [pickedTeamIds, setPickedTeamIds] = useState<string[]>([]);

    // Contract upload (step 2 après team picker)
    const [showContractStep, setShowContractStep] = useState(false);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [contractDragOver, setContractDragOver] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState("");
    const contractInputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() =>
        filter === "Toutes" ? reservations : reservations.filter(r => r.status === filter),
        [reservations, filter]
    );

    const fetchReservations = async (activeFilter: Status | "Toutes" = filter) => {
        setIsLoading(true);
        try {
            const query = activeFilter !== "Toutes" ? `?status=${encodeURIComponent(activeFilter)}` : "";
            const res = await fetch(`/api/admin/reservations${query}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Erreur de chargement");
            const data: Reservation[] = await res.json();
            setReservations(data);
            setSelected(prev => prev ? data.find(r => r.id === prev.id) || null : null);
        } catch {
            setReservations([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchReservations("Toutes"); }, []);
    useEffect(() => { fetchReservations(filter); }, [filter]);

    useEffect(() => {
        fetch("/api/admin/employes", { cache: "no-store" })
            .then(r => r.json())
            .then(data => setEmployees((data || []).map((emp: any) => ({
                id: emp.id,
                name: `${emp.prenom} ${emp.nom}`.trim(),
                role: emp.role,
                initiales: emp.initiales,
            }))))
            .catch(() => setEmployees([]));
    }, []);

    const updateStatus = async (id: string, status: Status, employeeIds?: string[]) => {
        const res = await fetch(`/api/admin/reservations/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, employeeIds }),
        });
        if (!res.ok) throw new Error("Impossible de mettre à jour le statut.");
        await fetchReservations(filter);
    };

    const deleteReservation = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Impossible de supprimer.");
            setSelected(null);
            await fetchReservations(filter);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erreur.");
        }
    };

    const toggleEmployee = (id: string) => {
        setPickedTeamIds(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
    };

    // Étape 1 → ouvrir team picker
    const openTeamPicker = () => {
        setPickedTeamIds(selected?.teamIds ?? []);
        setShowTeamPicker(true);
        setShowContractStep(false);
        setContractFile(null);
        setConfirmError("");
    };

    // Étape 1 validée → passer à l'upload contrat
    const handleNextToContract = () => {
        if (pickedTeamIds.length === 0) return;
        setShowTeamPicker(false);
        setShowContractStep(true);
    };

    // Étape 2 → confirmer avec contrat
    const handleFinalConfirm = async () => {
        if (!selected || !contractFile) return;
        setConfirming(true);
        setConfirmError("");
        try {
            const contractUrl = await uploadContractFile(contractFile);
            const res = await fetch(`/api/admin/reservations/${selected.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Confirmée", employeeIds: pickedTeamIds, contractUrl }),
            });
            if (!res.ok) throw new Error("Impossible de confirmer la réservation.");
            setShowContractStep(false);
            setContractFile(null);
            setPickedTeamIds([]);
            await fetchReservations(filter);
        } catch (err) {
            setConfirmError(err instanceof Error ? err.message : "Erreur lors de la confirmation.");
        } finally {
            setConfirming(false);
        }
    };

    const handleContractDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setContractDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) validateAndSetContractFile(file);
    };

    const validateAndSetContractFile = (file: File) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
            setConfirmError("Format non supporté. Utilisez PDF, JPG ou PNG.");
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setConfirmError("Fichier trop lourd (max 20 Mo).");
            return;
        }
        setConfirmError("");
        setContractFile(file);
    };

    const closePanel = () => {
        setSelected(null);
        setShowTeamPicker(false);
        setShowContractStep(false);
        setContractFile(null);
        setPickedTeamIds([]);
        setConfirmError("");
    };

    const counts: Record<Status, number> = {
        "En attente": reservations.filter(r => r.status === "En attente").length,
        "Confirmée": reservations.filter(r => r.status === "Confirmée").length,
        "Annulée": reservations.filter(r => r.status === "Annulée").length,
    };

    return (
        <div className="p-6 md:p-12 lg:p-16 space-y-10">

            <header className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Administration</p>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>Réservations</h1>
                <p className="text-lg text-slate-500 font-light leading-relaxed">Gérez les demandes de réservation des clients.</p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                    { label: "En attente", count: counts["En attente"], style: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20" },
                    { label: "Confirmées", count: counts["Confirmée"], style: "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20" },
                    { label: "Annulées", count: counts["Annulée"], style: "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20" },
                ] as const).map(s => (
                    <div key={s.label} className={`p-6 rounded-[2rem] border ${s.style} text-center`}>
                        <p className="text-3xl font-black">{s.count}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="flex gap-3 flex-wrap">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${filter === f
                            ? "bg-[#bca086] text-white border-[#bca086] shadow-lg shadow-[#bca086]/20"
                            : "bg-white dark:bg-zinc-900 text-slate-500 border-slate-100 dark:border-white/5 hover:border-[#bca086]/40 hover:text-[#bca086]"}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                <div className="grid grid-cols-12 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
                    <div className="col-span-3">Client</div>
                    <div className="col-span-2">Service</div>
                    <div className="col-span-2">Date & Heure</div>
                    <div className="col-span-2">Lieu</div>
                    <div className="col-span-2">Statut</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
                {!isLoading && filtered.length > 0 ? filtered.map(r => (
                    <div key={r.id} onClick={() => { setSelected(r); setShowTeamPicker(false); setShowContractStep(false); }}
                        className="grid grid-cols-12 px-8 py-5 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors group items-center cursor-pointer">
                        <div className="col-span-3">
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#bca086] transition-colors">{r.client}</p>
                            <p className="text-xs text-slate-400 font-medium">{r.email}</p>
                        </div>
                        <div className="col-span-2"><p className="text-sm font-bold text-slate-700 dark:text-slate-300">{r.service}</p></div>
                        <div className="col-span-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{r.date}</p>
                            <p className="text-xs text-slate-400 font-medium">{r.heure}</p>
                        </div>
                        <div className="col-span-2"><p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{r.lieu}</p></div>
                        <div className="col-span-2">
                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <button onClick={e => { e.stopPropagation(); deleteReservation(r.id); }}
                                className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                )) : !isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucune réservation</p>
                    </div>
                ) : (
                    <div className="py-20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#bca086] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                </div>
                </div>
            </div>

            {/* ── DETAIL PANEL ── */}
            {selected && (
                <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={closePanel}>
                    <div className="h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl p-10 space-y-8 overflow-y-auto"
                        onClick={e => e.stopPropagation()}>

                        {/* En-tête */}
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Détail de la réservation</p>
                                <h2 className={`${playfair.className} text-3xl italic text-slate-900 dark:text-white`}>{selected.client}</h2>
                                <p className="text-sm text-slate-500 mt-0.5">{selected.email}</p>
                            </div>
                            <button onClick={closePanel} className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-slate-400 hover:text-[#bca086] transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Infos */}
                        <div className="space-y-3">
                            {[
                                { label: "Service", value: selected.service },
                                { label: "Date", value: selected.date },
                                { label: "Heure", value: selected.heure },
                                { label: "Lieu", value: selected.lieu },
                            ].map(f => (
                                <div key={f.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{f.label}</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{f.value}</p>
                                </div>
                            ))}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Message</p>
                                <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">{selected.message}</p>
                            </div>
                        </div>

                        {/* Mini map if coordinates available */}
                        {selected.latitude && selected.longitude && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carte</p>
                                <LocationMapView
                                    lat={selected.latitude}
                                    lng={selected.longitude}
                                    address={selected.lieu}
                                />
                                <a
                                    href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=15/${selected.latitude}/${selected.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#bca086] hover:opacity-70 transition-opacity"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Ouvrir dans OpenStreetMap
                                </a>
                            </div>
                        )}

                        {/* Équipe assignée */}
                        {selected.team.length > 0 && !showTeamPicker && !showContractStep && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Équipe assignée</p>
                                <div className="flex flex-wrap gap-2">
                                    {selected.team.map(name => {
                                        const emp = employees.find(e => e.name === name);
                                        return (
                                            <div key={name} className="flex items-center gap-2 px-4 py-2 bg-[#bca086]/10 border border-[#bca086]/20 text-[#bca086] rounded-2xl">
                                                <span className="w-6 h-6 rounded-lg bg-[#bca086] text-white text-[9px] font-black flex items-center justify-center shrink-0">{emp?.initiales}</span>
                                                <span className="font-bold text-xs">{name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={openTeamPicker} className="text-xs font-black text-[#bca086] underline underline-offset-2 hover:opacity-70 transition-opacity">
                                    Modifier l&apos;équipe
                                </button>
                            </div>
                        )}

                        {/* ── ÉTAPE 1 : TEAM PICKER ── */}
                        {showTeamPicker && (
                            <div className="space-y-4 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-[#bca086] text-white text-xs font-black flex items-center justify-center">1</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#bca086]">Sélectionner l&apos;équipe</p>
                                </div>
                                <div className="space-y-2">
                                    {employees.map(emp => {
                                        const isPicked = pickedTeamIds.includes(emp.id);
                                        return (
                                            <button key={emp.id} onClick={() => toggleEmployee(emp.id)}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isPicked
                                                    ? "bg-[#bca086] border-[#bca086] text-white shadow-md shadow-[#bca086]/20"
                                                    : "bg-white dark:bg-zinc-800 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-[#bca086]/40"}`}>
                                                <span className={`w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${isPicked ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300"}`}>
                                                    {emp.initiales}
                                                </span>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm leading-none">{emp.name}</p>
                                                    <p className={`text-xs mt-0.5 ${isPicked ? "opacity-70" : "opacity-40"}`}>{emp.role}</p>
                                                </div>
                                                {isPicked && <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowTeamPicker(false)}
                                        className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-white dark:bg-zinc-800 text-slate-500 border border-slate-100 dark:border-white/5 hover:scale-[1.02] active:scale-95 transition-all">
                                        Annuler
                                    </button>
                                    <button onClick={handleNextToContract} disabled={pickedTeamIds.length === 0}
                                        className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${pickedTeamIds.length > 0
                                            ? "bg-[#bca086] text-white shadow-xl shadow-[#bca086]/20 hover:scale-[1.02] active:scale-95"
                                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"}`}>
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── ÉTAPE 2 : UPLOAD CONTRAT ── */}
                        {showContractStep && (
                            <div className="space-y-5 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#bca086] text-white text-xs font-black flex items-center justify-center">2</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#bca086]">Joindre le contrat</p>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Uploadez le contrat (PDF, JPG ou PNG) — il sera visible dans l&apos;espace du client.
                                </p>

                                {/* Zone drop */}
                                <div
                                    onDrop={handleContractDrop}
                                    onDragOver={e => { e.preventDefault(); setContractDragOver(true); }}
                                    onDragLeave={() => setContractDragOver(false)}
                                    onClick={() => contractInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${contractDragOver
                                        ? "border-[#bca086] bg-[#bca086]/5"
                                        : contractFile
                                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                                            : "border-slate-200 dark:border-white/10 hover:border-[#bca086]/50 hover:bg-slate-100/50 dark:hover:bg-white/5"}`}>
                                    <input
                                        ref={contractInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetContractFile(f); }}
                                    />
                                    {contractFile ? (
                                        <>
                                            {contractFile.type === "application/pdf" ? (
                                                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                                    <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                                    <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 line-clamp-1">{contractFile.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{(contractFile.size / 1024 / 1024).toFixed(2)} Mo</p>
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cliquer pour changer</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-700 flex items-center justify-center">
                                                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            </div>
                                            <p className="text-sm font-bold text-slate-500">Glissez ou cliquez pour uploader</p>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">PDF · JPG · PNG — max 20 Mo</p>
                                        </>
                                    )}
                                </div>

                                {confirmError && (
                                    <p className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 rounded-2xl">{confirmError}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowContractStep(false); setShowTeamPicker(true); setContractFile(null); setConfirmError(""); }}
                                        className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-white dark:bg-zinc-800 text-slate-500 border border-slate-100 dark:border-white/5 hover:scale-[1.02] active:scale-95 transition-all">
                                        ← Retour
                                    </button>
                                    <button
                                        onClick={handleFinalConfirm}
                                        disabled={!contractFile || confirming}
                                        className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${contractFile && !confirming
                                            ? "bg-[#bca086] text-white shadow-xl shadow-[#bca086]/20 hover:scale-[1.02] active:scale-95"
                                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"}`}>
                                        {confirming ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Upload…</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>Confirmer</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Actions statut (quand aucun picker ouvert) */}
                        {!showTeamPicker && !showContractStep && (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut actuel</p>
                                <span className={`inline-flex px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${STATUS_STYLES[selected.status]}`}>
                                    {selected.status}
                                </span>
                                <div className="grid grid-cols-1 gap-3 pt-2">
                                    {selected.status !== "Confirmée" && (
                                        <button onClick={openTeamPicker}
                                            className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all hover:scale-[1.02] active:scale-95 bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20 flex items-center justify-center gap-2">
                                            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0Z" /></svg>
                                            Confirmer &amp; joindre le contrat
                                        </button>
                                    )}
                                    {(["En attente", "Annulée"] as Status[]).filter(s => s !== selected.status).map(s => (
                                        <button key={s} onClick={() => updateStatus(selected.id, s)}
                                            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all hover:scale-[1.02] active:scale-95 ${STATUS_STYLES[s]}`}>
                                            Marquer comme « {s} »
                                        </button>
                                    ))}
                                    <button onClick={() => deleteReservation(selected.id)}
                                        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-200 dark:border-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        Supprimer la réservation
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
