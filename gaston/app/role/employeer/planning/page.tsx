"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface PlanningItem {
    id: string;
    type: "mission" | "reservation";
    title: string;
    date: string;
    time: string;
    location: string;
    color: string;
}

export default function PlanningPage() {
    const [items, setItems] = useState<PlanningItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlanning = async () => {
            try {
                const response = await fetch("/api/employeer/planning", { cache: "no-store" });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Impossible de charger le planning.");
                }
                setItems(result.data || []);
            } catch (error) {
                console.error("Erreur chargement planning employé:", error);
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlanning();
    }, []);

    const formattedItems = useMemo(() => {
        return items.map((item) => {
            const d = new Date(item.date);
            return {
                ...item,
                dateLabel: d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "short" }),
            };
        });
    }, [items]);

    return (
        <div className="p-6 md:p-12 lg:p-20 space-y-12">
            <header className="space-y-4">
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                    Planning
                </h1>
                <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                    Consultez votre calendrier de missions et préparez vos interventions à venir.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-6">
                        {!isLoading && formattedItems.length > 0 && formattedItems.map((item) => (
                            <div key={item.id} className="flex gap-8 p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
                                <div className="hidden md:flex flex-col items-center justify-center w-24 shrink-0 border-r border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase mb-2">{item.dateLabel.split(" ")[0]}</span>
                                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{item.dateLabel.split(" ")[1]}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase mt-2">{item.dateLabel.split(" ")[2]}</span>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full ${item.type === "reservation" ? "bg-[#bca086]" : "bg-slate-500"} text-white text-[9px] font-black uppercase tracking-widest`}>
                                            {item.type === "reservation" ? "Réservation confirmée" : "Mission"}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">{item.time}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-[#bca086] transition-colors uppercase tracking-tight">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4 opacity-50">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        <p className="text-sm font-medium">{item.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isLoading && formattedItems.length === 0 && (
                            <div className="py-24 flex flex-col items-center gap-4 text-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-300">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucune réservation confirmée à venir</p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="py-24 flex flex-col items-center gap-4 text-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement du planning...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="p-10 rounded-[2.5rem] bg-[#bca086] text-white shadow-xl shadow-[#bca086]/20">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-8">Statistiques Mensuelles</h3>
                        <div className="space-y-8">
                            <div>
                                <p className="text-4xl font-black tracking-tighter mb-1">{formattedItems.length}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Éléments à venir</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 text-center underline underline-offset-8 decoration-[#bca086]/30">Règle de planning</h3>
                        <p className="text-sm text-slate-500">Le planning affiche uniquement les éléments futurs, dont les réservations client confirmées.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
