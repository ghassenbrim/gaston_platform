"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications, AppNotification, NotifType } from "../../user/context/NotificationsContext";
import { useTranslation } from "@/lib/i18n/LanguageContext";

function getNotifLink(type: NotifType): string | null {
    if (type === "message") return "/role/employeer/chatadmin";
    if (type === "contract") return "/role/employeer/paiments";
    if (type === "photo") return "/role/employeer/dashboard";
    if (type === "reservation_confirmed" || type === "reservation_cancelled") return "/role/employeer/planning";
    if (type === "system") return "/role/employeer/planning";
    return null;
}

function NotifIcon({ type }: { type: NotifType }) {
    const base = "w-12 h-12 rounded-xl flex items-center justify-center shrink-0";

    if (type === "message") return (
        <div className={`${base} bg-[#bca086] text-white`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </div>
    );
    if (type === "payment" || type === "contract") return (
        <div className={`${base} bg-amber-100 dark:bg-amber-900/30 text-amber-600`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
        </div>
    );
    if (type === "planning") return (
        <div className={`${base} bg-blue-100 dark:bg-blue-900/30 text-blue-600`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
    );
    if (type === "work_day") return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>
        </div>
    );
    // default
    return (
        <div className={`${base} bg-slate-100 dark:bg-zinc-800 text-slate-500`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </div>
    );
}

function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} j`;
    return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function EmployeeNotificationPage() {
    const { t } = useTranslation();
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const router = useRouter();
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const filteredNotifications = filter === "unread" 
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const handleNotificationClick = (notif: AppNotification) => {
        if (!notif.isRead) {
            markAsRead(notif.id);
        }
        const link = getNotifLink(notif.type);
        if (link) {
            router.push(link);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                                Notifications
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Restez à jour avec toutes vos notifications
                            </p>
                        </div>
                        {notifications.some(n => !n.isRead) && (
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 bg-[#bca086] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-slate-200 dark:border-white/10">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                                filter === "all"
                                    ? "text-[#bca086] border-[#bca086]"
                                    : "text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
                            }`}
                        >
                            Toutes ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                                filter === "unread"
                                    ? "text-[#bca086] border-[#bca086]"
                                    : "text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
                            }`}
                        >
                            Non lues ({notifications.filter(n => !n.isRead).length})
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-20">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                                {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notif: AppNotification) => {
                            const link = getNotifLink(notif.type);
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 md:p-6 rounded-2xl border-2 transition-all cursor-pointer group ${
                                        notif.isRead
                                            ? "bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 opacity-60 hover:opacity-100"
                                            : "bg-slate-100 dark:bg-white/5 border-[#bca086]/30 hover:border-[#bca086]"
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        <NotifIcon type={notif.type} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="text-base font-bold text-slate-900 dark:text-white">
                                                    {notif.content}
                                                </p>
                                                {!notif.isRead && (
                                                    <div className="w-2.5 h-2.5 bg-[#bca086] rounded-full shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {timeAgo(notif.createdAt)}
                                                </p>
                                                {link && (
                                                    <p className="text-xs font-black text-[#bca086] group-hover:underline">
                                                        Ouvrir →
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Back Button */}
                <div className="mt-12 text-center">
                    <Link
                        href="/role/employeer/dashboard"
                        className="text-sm font-bold text-[#bca086] hover:underline"
                    >
                        ← Retour au dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
