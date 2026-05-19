"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface WorkDay {
    id: string;
    date: string;
    hours: number;
    description: string;
    status: string;
}

// Shared status badge — used in both card and table views
function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                status === "PAID"
                    ? "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20"
                    : status === "APPROVED"
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-white/5"
            }`}
        >
            {status === "PAID" ? "Payé" : status === "APPROVED" ? "Approuvé" : "En attente"}
        </span>
    );
}

export default function JoursTravaillesPage() {
    const [workDays, setWorkDays] = useState<WorkDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState("Tout");

    useEffect(() => {
        const fetchWorkDays = async () => {
            try {
                const response = await fetch("/api/employeer/jourstravailles", { cache: "no-store" });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Impossible de charger les jours travaillés.");
                }
                setWorkDays(result.data || []);
            } catch (error) {
                console.error("Erreur chargement jours travaillés:", error);
                setWorkDays([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkDays();
    }, []);

    const months = useMemo(() => {
        const monthSet = new Set<string>();
        workDays.forEach(wd => {
            const dateObj = new Date(wd.date);
            const monthYear = dateObj.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            monthSet.add(monthYear);
        });
        return Array.from(monthSet);
    }, [workDays]);

    const filteredData = useMemo(() => {
        if (selectedMonth === "Tout") return workDays;
        return workDays.filter(item => {
            const dateObj = new Date(item.date);
            const monthYear = dateObj.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            return monthYear === selectedMonth;
        });
    }, [selectedMonth, workDays]);

    const totalHours = useMemo(() => {
        return filteredData.reduce((acc, curr) => acc + curr.hours, 0);
    }, [filteredData]);

    if (isLoading) {
        return (
            <div className="p-6 md:p-12 lg:p-20 space-y-12">
                <header className="space-y-4">
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                        Jours Travaillés
                    </h1>
                </header>
                <div className="animate-pulse bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 h-64"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 lg:p-20 space-y-12">
            <header className="space-y-4">
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                    Jours Travaillés
                </h1>
                <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                    Consultez l&apos;historique de vos journées travaillées et vos heures validées par l&apos;administration.
                </p>
            </header>

            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden p-6 md:p-12">

                {/* ── Filter + stats header ── */}
                {/* Mobile: single flex row. md+: keep existing two-column layout */}
                <div className="flex flex-row items-center justify-between gap-4 mb-10 md:mb-12">
                    {/* Month filter */}
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2.5 md:px-6 md:py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#bca086]/20 cursor-pointer text-sm md:text-base"
                    >
                        <option value="Tout">Tout</option>
                        {months.map(month => (
                            <option key={month} value={month}>
                                {month.charAt(0).toUpperCase() + month.slice(1)}
                            </option>
                        ))}
                    </select>

                    {/* Stats — stacked on mobile, side-by-side on md+ */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Heures</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                                {totalHours > 0 ? `${totalHours}h` : "0h"}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Jours Validés</p>
                            <p className="text-xl md:text-2xl font-black text-[#bca086]">{filteredData.length}</p>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════
                    MOBILE CARD VIEW  (visible by default, hidden on md+)
                    ════════════════════════════════════════════ */}
                <div className="md:hidden space-y-3">
                    {filteredData.length > 0 ? (
                        filteredData.map((row, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 px-5 py-4 space-y-2"
                            >
                                {/* Top row: date + status badge */}
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{row.date}</p>
                                    <StatusBadge status={row.status} />
                                </div>

                                {/* Bottom row: description + hours */}
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500 truncate pr-4">{row.description}</p>
                                    <p className="text-sm font-black text-[#bca086] shrink-0">{row.hours}h</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucune donnée pour cette période</p>
                        </div>
                    )}
                </div>

                {/* ════════════════════════════════════════════
                    DESKTOP TABLE VIEW  (hidden on mobile, visible on md+)
                    ════════════════════════════════════════════ */}
                <div className="hidden md:block">
                    <div className="space-y-2">
                        <div className="overflow-x-auto">
                            <div className="min-w-[460px]">
                                <div className="grid grid-cols-6 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
                                    <div className="col-span-2">Date & Description</div>
                                    <div>Heures</div>
                                    <div>Statut</div>
                                    <div className="col-span-2"></div>
                                </div>

                                {filteredData.length > 0 ? (
                                    filteredData.map((row, idx) => (
                                        <div key={idx} className="grid grid-cols-6 px-6 py-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group items-center">
                                            <div className="col-span-2">
                                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#bca086] transition-colors">{row.date}</p>
                                                <p className="text-xs text-slate-500 font-medium opacity-60">{row.description}</p>
                                            </div>
                                            <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{row.hours}h</div>
                                            <div className="text-right">
                                                <StatusBadge status={row.status} />
                                            </div>
                                            <div className="col-span-2"></div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucune donnée pour cette période</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
