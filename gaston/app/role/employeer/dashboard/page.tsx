"use client";

import React, { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface DashboardData {
    employeeName: string;
    stats: {
        workDaysThisMonth: string;
        totalHours: string;
        nextService: string;
        estimatedPayment: string;
    };
    recentWorkDays: Array<{
        date: string;
        description: string;
        timeRange: string;
        status: string;
        hours: number;
    }>;
}

export default function EmployeeDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch("/api/employeer/dashboard", { cache: "no-store" });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Impossible de charger le dashboard.");
                }
                setData(result.data);
            } catch (error) {
                console.error("Erreur chargement dashboard employé:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (isLoading) {
        return (
            <div className="p-6 md:p-12 lg:p-20 space-y-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-48"></div>
                    <div className="h-16 bg-slate-200 dark:bg-zinc-800 rounded w-full"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-slate-200 dark:bg-zinc-800 rounded-[2.5rem]"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 md:p-12 lg:p-20 space-y-12">
                <p className="text-slate-400 font-bold">Erreur lors du chargement du dashboard</p>
            </div>
        );
    }

    const stats = [
        { label: "Jours travaillés", value: data.stats.workDaysThisMonth, detail: "ce mois-ci", color: "text-[#bca086]" },
        { label: "Heures totales", value: data.stats.totalHours, detail: "enregistrées", color: "text-[#bca086]" },
        { label: "Prochain service", value: data.stats.nextService, detail: "à venir", color: "text-[#bca086]" },
        { label: "Paiement estimé", value: data.stats.estimatedPayment, detail: "en attente", color: "text-[#bca086]" },
    ];

    return (
        <div className="p-6 md:p-12 lg:p-20 space-y-12">
            <header className="space-y-4">
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#bca086]/10 text-[#bca086] text-[10px] font-black uppercase tracking-[0.2em]">
                    Tableau de Bord Employé
                </div>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-7xl italic text-slate-900 dark:text-white leading-tight`}>
                    Bonjour, {data.employeeName}
                </h1>
                <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                    Ravi de vous revoir. Voici un aperçu de votre activité et de votre planning pour la semaine.
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-500 group">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 group-hover:text-[#bca086] transition-colors">
                            {stat.label}
                        </p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-4xl font-black tracking-tighter ${stat.color}`}>
                                {stat.value}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 opacity-60 uppercase tracking-wider">
                            {stat.detail}
                        </p>
                    </div>
                ))}
            </div>

            {/* Sections Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Upcoming Schedule */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
                            Derniers travaux validés
                        </h2>
                        <Link href="/role/employeer/jourstravailles" className="text-xs font-bold text-[#bca086] hover:underline underline-offset-4">
                            Voir tout l&apos;historique
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {data.recentWorkDays.length > 0 ? (
                            data.recentWorkDays.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-zinc-800/50 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 flex flex-col items-center justify-center shadow-sm shrink-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Jour</span>
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{item.hours}h</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#bca086] transition-colors">{item.date}</h3>
                                        <p className="text-xs text-slate-500 font-medium opacity-60">{item.description}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                                        item.status === "PAID" ? "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20" :
                                        item.status === "APPROVED" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30" :
                                        "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-white/5"
                                    }`}>
                                        {item.status === "PAID" ? "Payé" : item.status === "APPROVED" ? "Approuvé" : "En attente"}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun travail validé</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Direct Actions / Quick Access */}
                <div className="space-y-8">

                    <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-[#bca086] flex items-center justify-center text-white mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68 0-1.24-.56-1.24-1.24s.56-1.24 1.24-1.24 1.24.56 1.24 1.24-.56 1.24-1.24 1.24zM15.75 6.75h-7.5a.75.75 0 00-.75.75v7.5c0 .414.336.75.75.75h7.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                        </div>
                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-2">Note Importante</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                            N'oubliez pas de soumettre vos justificatifs de frais avant le 28 du mois pour un remboursement sur la prochaine fiche de paie.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
