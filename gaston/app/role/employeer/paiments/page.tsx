"use client";

import React, { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface PaymentHistory {
    date: string;
    amount: string;
    status: string;
    ref: string;
}

interface PaymentsData {
    totalPaid: string;
    history: PaymentHistory[];
    pendingAmount?: string;
    iban?: string;
}

export default function PaiementsPage() {
    const [data, setData] = useState<PaymentsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch("/api/employeer/paiments", { cache: "no-store" });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Impossible de charger les paiements.");
                }
                setData(result.data);
            } catch (error) {
                console.error("Erreur chargement paiements:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayments();
    }, []);

    if (isLoading) {
        return (
            <div className="p-6 md:p-12 lg:p-20 space-y-12">
                <header className="space-y-4">
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                        Paiements
                    </h1>
                </header>
                <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-slate-200 dark:bg-zinc-800 rounded-[2.5rem] h-64"></div>
                    <div className="space-y-8">
                        <div className="bg-slate-200 dark:bg-zinc-800 rounded-[2.5rem] h-32"></div>
                        <div className="bg-slate-200 dark:bg-zinc-800 rounded-[2.5rem] h-32"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 md:p-12 lg:p-20 space-y-12">
                <p className="text-slate-400 font-bold">Erreur lors du chargement des paiements</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 lg:p-20 space-y-12">
            <header className="space-y-4">
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                    Paiements
                </h1>
                <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                    Gérez vos revenus, consultez vos fiches de paie et suivez l&apos;état de vos futurs virements.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm p-8 md:p-12">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Historique des Virements</h2>
                        {data.history.length > 0 ? (
                            <div className="space-y-6">
                                {data.history.map((pay, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-zinc-800/40 group hover:bg-slate-100/50 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-[#bca086] shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.172a3.25 3.25 0 102.121-6.425L11.121 8.818a3.25 3.25 0 002.121 6.425l-.214-.172z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#bca086] transition-colors">{pay.amount}</p>
                                                <p className="text-xs text-slate-500 font-medium opacity-60">{pay.date} • {pay.ref}</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20">
                                            {pay.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun virement enregistré</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[#bca086] rounded-[2.5rem] p-10 text-white shadow-xl shadow-[#bca086]/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-8">Montant Total Versé</p>
                        <p className="text-5xl font-black tracking-tighter mb-2">{data.totalPaid}</p>
                        <p className="text-sm font-bold opacity-70 mb-10 italic">Depuis le début de votre emploi</p>
                        <div className="h-px bg-white/20 mb-8"></div>
                        <p className="text-xs font-medium leading-relaxed opacity-80">
                            Ceci représente le montant total des virements effectués à votre compte bancaire.
                        </p>
                    </div>

                    <div className="bg-slate-900 dark:bg-white rounded-[2.5rem] p-10 text-white dark:text-black shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50 mb-6">Informations Bancaires</h3>
                        <p className="text-sm font-bold mb-4">Virement SEPA</p>
                        <p className="text-xs font-mono opacity-60 break-all mb-8">{data.iban || "Non configuré"}</p>
                        <button className="w-full py-4 rounded-2xl bg-white/10 dark:bg-black/5 text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white/20 dark:hover:bg-black/10 transition-all">
                            Modifier le RIB
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
