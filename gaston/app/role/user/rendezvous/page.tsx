"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

type RendezVousStatus = "En attente" | "Confirmé" | "Annulé";

interface RendezVous {
    id: string;
    service: string;
    date: string;
    dateISO: string;
    heure: string;
    lieu: string;
    status: RendezVousStatus;
}

const statusStyles: Record<RendezVousStatus, string> = {
    "En attente": "bg-amber-50 text-amber-600 border-amber-200",
    "Confirmé":   "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "Annulé":     "bg-rose-50 text-rose-500 border-rose-200",
};

const statusIcons: Record<RendezVousStatus, React.ReactNode> = {
    "En attente": (
        <span className="relative flex h-2.5 w-2.5 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
    ),
    "Confirmé": (
        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
    ),
    "Annulé": (
        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
};

function ReservationTable({ items }: { items: RendezVous[] }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[620px]">
                    <div className="grid grid-cols-12 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
                        <div className="col-span-3">Service</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Heure</div>
                        <div className="col-span-3">Lieu</div>
                        <div className="col-span-2">Statut</div>
                    </div>
                    {items.map((rdv) => (
                        <div key={rdv.id} className="grid grid-cols-12 px-8 py-6 border-b border-slate-50 dark:border-white/5 last:border-0 items-center hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                            <div className="col-span-3">
                                <p className="font-bold text-slate-900 dark:text-white">{rdv.service}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{rdv.date}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{rdv.heure}</p>
                            </div>
                            <div className="col-span-3">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{rdv.lieu}</p>
                            </div>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[rdv.status]}`}>
                                    {statusIcons[rdv.status]}
                                    {rdv.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-50 dark:divide-white/5">
                {items.map((rdv) => (
                    <div key={rdv.id} className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-slate-900 dark:text-white">{rdv.service}</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${statusStyles[rdv.status]}`}>
                                {statusIcons[rdv.status]}
                                {rdv.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span>{rdv.date}</span>
                            <span>•</span>
                            <span>{rdv.heure}</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{rdv.lieu}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PlanningPage() {
    const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRendezVous = async () => {
            try {
                const response = await fetch("/api/user/rendezvous", { cache: "no-store" });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error);
                setRendezVous(result.data || []);
            } catch (error) {
                console.error("Erreur chargement rendez-vous:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRendezVous();
    }, []);

    const today = useMemo(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d;
    }, []);

    const pending = useMemo(() =>
        rendezVous.filter(r => r.status === "En attente" && new Date(r.dateISO) >= today),
        [rendezVous, today]
    );

    const confirmed = useMemo(() =>
        rendezVous.filter(r => r.status === "Confirmé" && new Date(r.dateISO) >= today),
        [rendezVous, today]
    );

    const cancelled = useMemo(() =>
        rendezVous.filter(r => r.status === "Annulé"),
        [rendezVous]
    );

    return (
        <div className="p-6 md:p-12 lg:p-20 max-w-7xl">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                <div className="space-y-4">
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-7xl italic text-slate-900 dark:text-white leading-tight`}>
                        Planning
                    </h1>
                    <p className="text-xl text-slate-500 font-light max-w-xl leading-relaxed">
                        Gérez vos réservations et consultez le calendrier de vos événements.
                    </p>
                </div>
                <Link href="/role/user/rendezvous/new-reservation"
                    className="flex items-center gap-3 px-8 py-5 bg-[#bca086] hover:scale-105 text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-2xl shadow-xl shadow-[#bca086]/20 transition-all active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nouveau RDV
                </Link>
            </header>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-10 h-10 border-4 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-14">

                    {/* ── EN ATTENTE ── */}
                    {pending.length > 0 && (
                        <section className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600">
                                        En attente de confirmation
                                    </h2>
                                </div>
                                <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-3 py-1 rounded-full">{pending.length}</span>
                            </div>

                            {/* Bannière info */}
                            <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                    Vos demandes sont en cours de traitement. L&apos;équipe Gaston vous contactera et vous recevrez une notification dès confirmation ou annulation.
                                </p>
                            </div>

                            <ReservationTable items={pending} />
                        </section>
                    )}

                    {/* ── CONFIRMÉES ── */}
                    {confirmed.length > 0 && (
                        <section className="space-y-5">
                            <div className="flex items-center gap-4">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#bca086]">
                                    Réservations confirmées
                                </h2>
                                <span className="text-[10px] font-black bg-[#bca086]/10 text-[#bca086] px-3 py-1 rounded-full">{confirmed.length}</span>
                            </div>
                            <ReservationTable items={confirmed} />
                        </section>
                    )}

                    {/* ── ANNULÉES ── */}
                    {cancelled.length > 0 && (
                        <section className="space-y-5">
                            <div className="flex items-center gap-4">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-400">
                                    Réservations annulées
                                </h2>
                                <span className="text-[10px] font-black bg-rose-50 text-rose-400 px-3 py-1 rounded-full">{cancelled.length}</span>
                            </div>
                            <ReservationTable items={cancelled} />
                        </section>
                    )}

                    {/* ── VIDE ── */}
                    {pending.length === 0 && confirmed.length === 0 && cancelled.length === 0 && (
                        <div className="border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-slate-400 bg-slate-50/30 dark:bg-zinc-900/10 min-h-[400px]">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-8">
                                <svg className="w-10 h-10 opacity-30 text-[#bca086]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-lg font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Aucune réservation
                            </p>
                            <p className="text-sm mt-3 opacity-60 text-center max-w-sm">
                                Planifiez votre première session avec l&apos;équipe Gaston.
                            </p>
                            <Link href="/role/user/rendezvous/new-reservation"
                                className="mt-8 px-8 py-4 bg-[#bca086] text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-2xl hover:scale-105 transition-all shadow-lg shadow-[#bca086]/20">
                                Réserver maintenant
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
