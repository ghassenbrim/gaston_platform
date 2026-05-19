"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { useNotifications, AppNotification, NotifType } from "../context/NotificationsContext";

function getNotifLink(type: NotifType, pathname: string): string | null {
    const isEmployee = pathname.startsWith("/role/employeer");
    if (type === "message") return isEmployee ? "/role/employeer/chatadmin" : "/role/user/messagebox";
    if (type === "reservation_confirmed" || type === "reservation_cancelled") return "/role/user/rendezvous";
    if (type === "photo") return "/role/user/mesphotos";
    if (type === "contract") return "/role/employeer/paiments";
    return null;
}

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `Il y a ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `Il y a ${d} j`;
    return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Config par type ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, {
    label: string;
    icon: React.ReactNode;
    iconBg: string;
}> = {
    message: {
        label: "Message",
        iconBg: "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
    },
    photo: {
        label: "Photo",
        iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 shadow-lg shadow-amber-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    reservation_confirmed: {
        label: "Rendez-vous confirmé",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-lg shadow-emerald-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    },
    reservation_cancelled: {
        label: "Rendez-vous annulé",
        iconBg: "bg-red-100 dark:bg-red-900/30 text-red-500 shadow-lg shadow-red-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    contract: {
        label: "Contrat",
        iconBg: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 shadow-lg shadow-rose-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    payment: {
        label: "Paiement",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-lg shadow-emerald-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-5a9 9 0 100 18 9 9 0 000-18zm0 5v4l3 1" /></svg>,
    },
    planning: {
        label: "Planning",
        iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 shadow-lg shadow-blue-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V4m8 3V4M5 11h14M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    },
    work_day: {
        label: "Jour travaillé",
        iconBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 shadow-lg shadow-violet-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V4m8 3V4M5 11h14M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    },
    system: {
        label: "Système",
        iconBg: "bg-slate-100 dark:bg-zinc-800 text-slate-500 shadow-lg shadow-slate-500/10",
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    },
};

// ─── Carte notification ───────────────────────────────────────────────────────
function NotifCard({ notif, onRead, onNavigate }: { notif: AppNotification; onRead: (id: string) => void; onNavigate: (type: NotifType) => void }) {
    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;

    return (
        <div
            onClick={() => { if (!notif.isRead) onRead(notif.id); onNavigate(notif.type); }}
            className={`p-8 rounded-[2.5rem] border transition-all duration-300 group cursor-pointer ${notif.isRead
                ? "bg-slate-50/50 dark:bg-zinc-900/20 border-transparent opacity-55 hover:opacity-70"
                : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:-translate-y-0.5"
                }`}
        >
            <div className="flex gap-6 md:gap-8">
                {/* Icône */}
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${cfg.iconBg}`}>
                    {cfg.icon}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400">
                            {cfg.label}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{timeAgo(notif.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-sm md:text-base">{notif.content}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#bca086]/70 mt-0.5">
                        {notif.isRead ? "Ouvrir →" : "Appuyez pour ouvrir →"}
                    </p>
                </div>

                {/* Point non lu */}
                {!notif.isRead && (
                    <div className="w-3 h-3 bg-[#bca086] rounded-full shrink-0 shadow-lg shadow-[#bca086]/50 mt-1 animate-pulse" />
                )}
            </div>
        </div>
    );
}

// ─── Squelettes de chargement ─────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="p-8 rounded-[2.5rem] bg-slate-100 dark:bg-zinc-800/50 animate-pulse flex gap-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-200 dark:bg-zinc-700 shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
                <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded-full w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded-full w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded-full w-1/2" />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationPage() {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const router   = useRouter();
    const pathname = usePathname();

    const handleNavigate = (type: NotifType) => {
        const link = getNotifLink(type, pathname);
        if (link) router.push(link);
    };

    return (
        <div className="p-6 md:p-12 lg:p-20 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                <div className="space-y-4">
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-7xl italic text-slate-900 dark:text-white leading-tight`}>
                        Notifications
                    </h1>
                    <p className="text-xl text-slate-500 font-light max-w-xl leading-relaxed">
                        Suivez l&apos;actualité de vos projets et les dernières mises à jour de votre espace.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="px-8 py-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#bca086] hover:border-[#bca086]/30 hover:bg-slate-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                    >
                        Tout marquer comme lu ({unreadCount})
                    </button>
                )}
            </header>

            {/* Stats rapides */}
            {!loading && notifications.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-10">
                    {[
                        { label: "Total", count: notifications.length, color: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300" },
                        { label: "Non lues", count: unreadCount, color: unreadCount > 0 ? "bg-[#bca086]/10 text-[#bca086] border border-[#bca086]/20" : "bg-slate-100 dark:bg-zinc-800 text-slate-400" },
                        { label: "Messages", count: notifications.filter(n => n.type === "message").length, color: "bg-[#bca086]/10 text-[#bca086]" },
                        { label: "Photos", count: notifications.filter(n => n.type === "photo").length, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600" },
                        { label: "Rendez-vous", count: notifications.filter(n => n.type.startsWith("reservation")).length, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" },
                    ].filter(s => s.count > 0).map(s => (
                        <div key={s.label} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.color}`}>
                            {s.label} · {s.count}
                        </div>
                    ))}
                </div>
            )}

            {/* Liste */}
            <div className="space-y-5">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : notifications.length === 0 ? (
                    <div className="text-center py-32 bg-slate-50 dark:bg-zinc-900/20 rounded-[3rem] border border-dashed border-slate-100 dark:border-white/5 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-800 mx-auto flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-200 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Tout est à jour.</p>
                            <p className="text-slate-400 text-sm mt-2 opacity-70">Vous n&apos;avez aucune notification pour le moment.</p>
                        </div>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <NotifCard key={notif.id} notif={notif} onRead={markAsRead} onNavigate={handleNavigate} />
                    ))
                )}
            </div>
        </div>
    );
}
