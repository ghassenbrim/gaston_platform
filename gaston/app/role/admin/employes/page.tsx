"use client";

import React, { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

const getTodayDateValue = () => new Date().toISOString().split("T")[0];

interface Employee {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    role: string;
    dateEntree: string;
    statut: "Actif" | "Inactif";
    initiales: string;
}

type Modal = null | "addEmployee" | "addDay";

export default function EmployesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [modal, setModal] = useState<Modal>(null);
    const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Form: Add Employee
    const [newPrenom, setNewPrenom] = useState("");
    const [newNom, setNewNom] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newRole, setNewRole] = useState("Photographe");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [newDateEntree, setNewDateEntree] = useState(getTodayDateValue());

    // Form: Add Day
    const [dayDate, setDayDate] = useState("");
    const [dayDesc, setDayDesc] = useState("");
    const [dayStart, setDayStart] = useState("");
    const [dayEnd, setDayEnd] = useState("");
    const [dayStatut, setDayStatut] = useState<"Payé" | "En attente">("En attente");

    const closeModal = () => {
        setModal(null);
        setSelectedEmpId(null);
        setNewPrenom(""); setNewNom(""); setNewEmail(""); setNewPhone(""); setNewRole("Photographe"); setNewPassword(""); setNewPasswordConfirm(""); setNewDateEntree(getTodayDateValue());
        setDayDate(""); setDayDesc(""); setDayStart(""); setDayEnd(""); setDayStatut("En attente");
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const showError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(""), 3000);
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/admin/employes", { cache: "no-store" });
            if (!response.ok) throw new Error("Erreur de chargement");
            const data: Employee[] = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error("Erreur lors du chargement des employés:", error);
            setEmployees([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirm) {
            showError("Les mots de passe ne correspondent pas.");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch("/api/admin/employes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prenom: newPrenom,
                    nom: newNom,
                    email: newEmail,
                    phone: newPhone,
                    password: newPassword,
                    role: newRole,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Impossible de creer l'employe.");
            }

            await fetchEmployees();
            closeModal();
            showSuccess("Employé ajouté avec succès !");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inconnue.";
            showError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddDay = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            closeModal();
            showSuccess("Journée enregistrée avec succès !");
        }, 1000);
    };

    const toggleStatut = (id: string) => {
        setEmployees(employees.map(emp =>
            emp.id === id ? { ...emp, statut: emp.statut === "Actif" ? "Inactif" : "Actif" } : emp
        ));
    };

    const selectedEmp = employees.find(e => e.id === selectedEmpId);

    return (
        <div className="p-6 md:p-12 lg:p-16 space-y-10 relative">
            {/* Success Toast */}
            {successMsg && (
                <div className="fixed top-24 right-4 sm:right-12 z-[200] bg-emerald-500 text-white px-6 sm:px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3 max-w-[calc(100vw-2rem)]">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-bold text-sm">{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="fixed top-24 right-4 sm:right-12 z-[200] bg-rose-500 text-white px-6 sm:px-8 py-4 rounded-2xl shadow-2xl shadow-rose-500/30 flex items-center gap-3 max-w-[calc(100vw-2rem)]">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-bold text-sm">{errorMsg}</span>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Gestion</p>
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                        Employés
                    </h1>
                    <p className="text-lg text-slate-500 font-light leading-relaxed">
                        {employees.filter(e => e.statut === "Actif").length} employés actifs · {employees.length} au total
                    </p>
                </div>
                <button
                    onClick={() => setModal("addEmployee")}
                    className="flex items-center gap-3 px-8 py-4 bg-[#bca086] text-white font-bold rounded-2xl shadow-xl shadow-[#bca086]/20 hover:scale-105 active:scale-95 transition-all self-start md:self-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Ajouter un employé
                </button>
            </header>

            {/* Employee Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
                    <div className="col-span-3">Employé</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-2">Rôle</div>
                    <div className="col-span-2">Date d&apos;entrée</div>
                    <div className="col-span-1">Statut</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {employees.map((emp) => (
                    <div key={emp.id} className="grid grid-cols-12 px-8 py-6 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors group items-center">
                        {/* Avatar + Name */}
                        <div className="col-span-3 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-400 shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700 transition-colors">
                                {emp.initiales}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">{emp.prenom} {emp.nom}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="col-span-3">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{emp.email}</p>
                        </div>

                        {/* Role */}
                        <div className="col-span-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{emp.role}</p>
                        </div>

                        {/* Date Entrée */}
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{emp.dateEntree}</p>
                        </div>

                        {/* Statut */}
                        <div className="col-span-1">
                            <button onClick={() => toggleStatut(emp.id)}>
                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-all hover:scale-105 ${emp.statut === "Actif"
                                    ? "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-white/5"
                                    }`}>
                                    {emp.statut}
                                </span>
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end gap-2">
                            <button
                                onClick={() => { setSelectedEmpId(emp.id); setModal("addDay"); }}
                                title="Enregistrer une journée"
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:bg-[#bca086] hover:text-white transition-all hover:scale-110 active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008Z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setEmployees(employees.filter(e => e.id !== emp.id))}
                                title="Supprimer l'employé"
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                {!isLoading && employees.length === 0 && (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0Z" />
                            </svg>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun employé enregistré</p>
                    </div>
                )}

                {isLoading && (
                    <div className="py-24 text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des employés...</p>
                    </div>
                )}
                </div>
                </div>
            </div>

            {/* ── MODAL: Ajouter un Employé ── */}
            {modal === "addEmployee" && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8 border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className={`${playfair.className} text-3xl italic text-slate-900 dark:text-white`}>Nouvel employé</h2>
                                <p className="text-sm text-slate-500 mt-1">Remplissez les informations du nouveau membre.</p>
                            </div>
                            <button onClick={closeModal} className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-slate-400 hover:text-slate-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddEmployee} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prénom</label>
                                    <input required value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Jean" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nom</label>
                                    <input required value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                                <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jean@gaston.fr" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Numéro de téléphone</label>
                                <input required type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+216 12 345 678" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rôle</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm">
                                        <option>Photographe</option>
                                        <option>Pilote de drone</option>
                                        <option>Assistant</option>
                                        <option>Vidéaste</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date d&apos;entrée</label>
                                    <input required type="date" value={newDateEntree} readOnly className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de passe</label>
                                    <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="********" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmer mot de passe</label>
                                    <input required type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} placeholder="********" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                                </div>
                            </div>
                            <button type="submit" disabled={isSaving} className={`w-full py-4 bg-[#bca086] text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl shadow-xl shadow-[#bca086]/20 transition-all flex items-center justify-center gap-3 ${isSaving ? "opacity-70 scale-95 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"}`}>
                                {isSaving && <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>}
                                {isSaving ? "Ajout en cours..." : "Confirmer l'ajout"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: Enregistrer une journée ── */}
            {modal === "addDay" && selectedEmp && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8 border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Journée pour</p>
                                <h2 className={`${playfair.className} text-3xl italic text-slate-900 dark:text-white`}>{selectedEmp.prenom} {selectedEmp.nom}</h2>
                                <p className="text-sm text-slate-500 mt-1">{selectedEmp.role}</p>
                            </div>
                            <button onClick={closeModal} className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-slate-400 hover:text-slate-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddDay} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</label>
                                <input required value={dayDate} onChange={e => setDayDate(e.target.value)} placeholder="Ex: Lundi 24 Fév" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                                <input required value={dayDesc} onChange={e => setDayDesc(e.target.value)} placeholder="Ex: Shooting Mariage - Paris" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Heure Départ</label>
                                    <input required type="time" value={dayStart} onChange={e => setDayStart(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm text-center" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Heure Fin</label>
                                    <input required type="time" value={dayEnd} onChange={e => setDayEnd(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/10 font-bold dark:text-white text-sm text-center" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Statut Paiement</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["En attente", "Payé"] as const).map(s => (
                                        <button key={s} type="button" onClick={() => setDayStatut(s)} className={`py-3 rounded-2xl text-sm font-black border transition-all ${dayStatut === s ? "bg-[#bca086] text-white border-[#bca086]" : "bg-slate-50 dark:bg-zinc-800 text-slate-500 border-slate-100 dark:border-white/5 hover:border-slate-300"}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={isSaving} className={`w-full py-4 bg-[#bca086] text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl shadow-xl shadow-[#bca086]/20 transition-all flex items-center justify-center gap-3 ${isSaving ? "opacity-70 scale-95 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"}`}>
                                {isSaving && <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>}
                                {isSaving ? "Enregistrement..." : "Enregistrer la journée"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
