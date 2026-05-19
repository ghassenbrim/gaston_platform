"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface ReservationPlanning {
    id: string;
    client: string;
    email: string;
    service: string;
    date: string;
    dateISO: string;
    time: string;
    lieu: string;
}

type Period = "today" | "upcoming" | "past";

function getPeriod(dateISO: string, time: string): Period {
    const now = new Date();
    const resDate = new Date(dateISO);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const resDay     = new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate());

    // Combiner date + heure pour comparaison précise
    const [h, m] = (time || "00:00").split(":").map(Number);
    const resDateTime = new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate(), h, m);

    if (resDay.getTime() === todayStart.getTime()) {
        if (resDateTime < now) return "past";  // aujourd'hui mais heure passée
        return "today";
    }
    if (resDay < todayStart) return "past";
    return "upcoming";
}

const periodConfig = {
    today: {
        label: "Aujourd'hui",
        badge: "bg-blue-50 text-blue-600 border-blue-200",
        dot: "bg-blue-500",
        ping: true,
        cardBorder: "border-blue-200 dark:border-blue-500/20",
        cardGlow: "shadow-blue-100 dark:shadow-blue-900/20",
        tag: "bg-blue-50 text-blue-600 border-blue-100",
    },
    upcoming: {
        label: "À venir",
        badge: "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
        dot: "bg-[#bca086]",
        ping: false,
        cardBorder: "border-slate-100 dark:border-white/5",
        cardGlow: "shadow-slate-100/50",
        tag: "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    },
    past: {
        label: "Passée",
        badge: "bg-slate-100 text-slate-400 border-slate-200",
        dot: "bg-slate-400",
        ping: false,
        cardBorder: "border-slate-100 dark:border-white/5",
        cardGlow: "",
        tag: "bg-slate-100 text-slate-400 border-slate-200",
    },
};

function EventCard({ event }: { event: ReservationPlanning }) {
    const period = getPeriod(event.dateISO, event.time);
    const config = periodConfig[period];

    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-[2rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group p-8 space-y-5 relative overflow-hidden
            ${config.cardBorder} ${config.cardGlow}`}>

            {/* Indicateur période top-right */}
            <div className="absolute top-6 right-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.badge}`}>
                    {config.ping ? (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
                        </span>
                    ) : (
                        <span className={`inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
                    )}
                    {config.label}
                </span>
            </div>

            {/* Badge Confirmée */}
            <span className="inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20">
                Confirmée
            </span>

            <div>
                <h3 className={`font-black text-lg leading-snug transition-colors ${period === "past" ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white group-hover:text-[#bca086]"}`}>
                    {event.service} — {event.client}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{event.email}</p>
            </div>

            <div className={`space-y-2.5 text-sm ${period === "past" ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 text-slate-500">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span className="font-semibold">{event.date}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{event.time}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="font-semibold truncate">{event.lieu}</span>
                </div>
            </div>
        </div>
    );
}

export default function AdminPlanningPage() {
    const [reservations, setReservations] = useState<ReservationPlanning[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | Period>("all");

    useEffect(() => {
        const fetchPlanning = async () => {
            try {
                const response = await fetch("/api/admin/reservations?status=Confirm%C3%A9e", { cache: "no-store" });
                if (!response.ok) throw new Error("Erreur de chargement");
                const data: ReservationPlanning[] = await response.json();
                setReservations(data);
            } catch (error) {
                console.error("Erreur chargement planning admin:", error);
                setReservations([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlanning();
    }, []);

    const todayEvents    = useMemo(() => reservations.filter(r => getPeriod(r.dateISO, r.time) === "today"),    [reservations]);
    const upcomingEvents = useMemo(() => reservations.filter(r => getPeriod(r.dateISO, r.time) === "upcoming"), [reservations]);
    const pastEvents     = useMemo(() => reservations.filter(r => getPeriod(r.dateISO, r.time) === "past"),     [reservations]);

    const filtered = useMemo(() => {
        if (filter === "all") return reservations;
        return reservations.filter(r => getPeriod(r.dateISO, r.time) === filter);
    }, [reservations, filter]);

    const filters: { key: "all" | Period; label: string; count: number; style: string }[] = [
        { key: "all",      label: "Toutes",       count: reservations.length, style: "bg-slate-900 text-white" },
        { key: "today",    label: "Aujourd'hui",   count: todayEvents.length,  style: "bg-blue-500 text-white" },
        { key: "upcoming", label: "À venir",       count: upcomingEvents.length, style: "bg-[#bca086] text-white" },
        { key: "past",     label: "Passées",       count: pastEvents.length,   style: "bg-slate-200 text-slate-600" },
    ];

    return (
        <div className="p-6 md:p-12 lg:p-16 space-y-10">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Administration</p>
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                        Planning
                    </h1>
                    <p className="text-lg text-slate-500 font-light">
                        Toutes les réservations confirmées.
                    </p>
                </div>

                {/* Stats rapides */}
                {!isLoading && (
                    <div className="flex gap-3 flex-wrap">
                        {todayEvents.length > 0 && (
                            <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                    {todayEvents.length} aujourd&apos;hui
                                </span>
                            </div>
                        )}
                        {upcomingEvents.length > 0 && (
                            <div className="flex items-center gap-2 px-5 py-3 bg-[#bca086]/10 border border-[#bca086]/20 rounded-2xl">
                                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#bca086]"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#bca086]">
                                    {upcomingEvents.length} à venir
                                </span>
                            </div>
                        )}
                        {pastEvents.length > 0 && (
                            <div className="flex items-center gap-2 px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl">
                                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {pastEvents.length} passée{pastEvents.length > 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Filtres */}
            {!isLoading && reservations.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {filters.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap
                                ${filter === f.key ? f.style : "bg-white dark:bg-zinc-900 text-slate-400 border border-slate-100 dark:border-white/5 hover:border-slate-300"}`}>
                            {f.label}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${filter === f.key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Grid */}
            {isLoading ? (
                <div className="py-24 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" />
                </div>
            ) : filtered.length > 0 ? (
                <div className="space-y-10">
                    {/* Aujourd'hui en priorité */}
                    {(filter === "all" || filter === "today") && todayEvents.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                                Aujourd&apos;hui — {todayEvents.length} séance{todayEvents.length > 1 ? "s" : ""}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {todayEvents.map(e => <EventCard key={e.id} event={e} />)}
                            </div>
                        </div>
                    )}

                    {/* À venir */}
                    {(filter === "all" || filter === "upcoming") && upcomingEvents.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#bca086] flex items-center gap-2">
                                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#bca086]"></span>
                                À venir — {upcomingEvents.length} séance{upcomingEvents.length > 1 ? "s" : ""}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {upcomingEvents.map(e => <EventCard key={e.id} event={e} />)}
                            </div>
                        </div>
                    )}

                    {/* Passées */}
                    {(filter === "all" || filter === "past") && pastEvents.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                                Passées — {pastEvents.length} séance{pastEvents.length > 1 ? "s" : ""}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-70">
                                {pastEvents.map(e => <EventCard key={e.id} event={e} />)}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center gap-4 text-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucune réservation</p>
                </div>
            )}
        </div>
    );
}
