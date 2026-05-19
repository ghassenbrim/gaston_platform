"use client";

import React, { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

// ─── Icônes stats ────────────────────────────────────────────────────────────

const ICONS = [
    <svg key="emp" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>,
    <svg key="hrs" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>,
    <svg key="pay" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>,
    <svg key="days" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>,
];

const STAT_META = [
    { labelKey: "admin_stat_active_emp", subKey: "admin_stat_active_emp_sub" },
    { labelKey: "admin_stat_total_hours", subKey: "admin_stat_total_hours_sub" },
    { labelKey: "admin_stat_pending_pay", subKey: "admin_stat_pending_pay_sub" },
    { labelKey: "admin_stat_reservations", subKey: "admin_stat_reservations_sub" },
];

// ─── Icônes activité par type ─────────────────────────────────────────────────

type ActivityType = "workday" | "reservation" | "user" | "employee" | "payment";

// ─── Mapping des couleurs pour les statuses ─────────────────────────────────

const STATUS_BADGE_COLORS: Record<string, string> = {
    "Payé":      "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "Complété":  "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "Confirmée": "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    "Approuvé":  "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    "En attente":"bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800 dark:border-white/5",
    "Annulée":   "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    "Annulé":    "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    "Paid":      "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "Completed": "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "Confirmed": "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    "Approved":  "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    "Pending":   "bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800 dark:border-white/5",
    "Cancelled": "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    "مدفوع":     "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "مكتمل":     "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
    "مؤكد":      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    "موافق عليه": "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    "قيد الانتظار": "bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800 dark:border-white/5",
    "ملغاة":     "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    "ملغى":      "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
};

function getStatusColorClasses(status: string | null) {
    if (!status) return STATUS_BADGE_COLORS["Pending"] ?? STATUS_BADGE_COLORS["قيد الانتظار"] ?? "bg-slate-100 text-slate-400 border-slate-200";
    return STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS["Pending"] ?? STATUS_BADGE_COLORS["قيد الانتظار"] ?? "bg-slate-100 text-slate-400 border-slate-200";
}

const ACTIVITY_META: Record<ActivityType, { color: string; bg: string; icon: React.ReactNode }> = {
    workday: {
        color: "text-slate-600 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-zinc-800",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    reservation: {
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
        ),
    },
    user: {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        ),
    },
    employee: {
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
            </svg>
        ),
    },
    payment: {
        color: "text-[#bca086]",
        bg: "bg-[#bca086]/10",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
        ),
    },
};

function statusBadge(status: string | null) {
    if (!status) return null;
    const map: Record<string, string> = {
        "Payé":      "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
        "Complété":  "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20",
        "Confirmée": "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        "Approuvé":  "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        "En attente":"bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800 dark:border-white/5",
        "Annulée":   "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
        "Annulé":    "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${map[status] ?? map["En attente"]}`}>
            {status}
        </span>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
    activeEmployees: string;
    totalHours: string;
    pendingPayments: string;
    registeredDays: string;
};

type Activity = {
    type: ActivityType;
    title: string;
    subtitle: string;
    date: string;
    status: string | null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<Stats | null>(null);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/dashboard")
            .then(res => res.json())
            .then(data => {
                setStats(data.stats);
                setActivity(data.activity);
            })
            .finally(() => setLoading(false));
    }, []);

    const statValues = stats
        ? [
            { ...STAT_META[0], value: stats.activeEmployees, icon: ICONS[0], label: t(STAT_META[0].labelKey as any), sub: t(STAT_META[0].subKey as any) },
            { ...STAT_META[1], value: stats.totalHours, icon: ICONS[1], label: t(STAT_META[1].labelKey as any), sub: t(STAT_META[1].subKey as any) },
            { ...STAT_META[2], value: stats.pendingPayments, icon: ICONS[2], label: t(STAT_META[2].labelKey as any), sub: t(STAT_META[2].subKey as any) },
            { ...STAT_META[3], value: stats.registeredDays, icon: ICONS[3], label: t(STAT_META[3].labelKey as any), sub: t(STAT_META[3].subKey as any) },
        ]
        : STAT_META.map((m, i) => ({ ...m, value: "—", icon: ICONS[i], label: t(m.labelKey as any), sub: t(m.subKey as any) }));

    return (
        <div className="p-6 md:p-12 lg:p-16 space-y-12">
            {/* Header */}
            <header className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t("admin_dash_label")}</p>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                    {t("admin_dash_title")}
                </h1>
                <p className="text-lg text-slate-500 font-light max-w-xl leading-relaxed">
                    {t("admin_dash_desc")}
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statValues.map((stat, idx) => (
                    <div key={idx} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#bca086] text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-md shadow-[#bca086]/20">
                            {stat.icon}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{stat.label}</p>
                        {loading ? (
                            <div className="h-10 w-16 rounded-xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                        ) : (
                            <p className="text-4xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                        )}
                        <p className="text-[10px] font-medium text-slate-400 mt-2">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick Action + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("admin_quick_actions")}</h2>
                    <Link href="/role/admin/employes" className="flex items-center gap-5 p-6 rounded-[2rem] bg-[#bca086] text-white shadow-xl shadow-[#bca086]/20 hover:scale-[1.02] active:scale-95 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-black text-base">{t("admin_manage_employees")}</p>
                            <p className="text-xs opacity-60 font-medium mt-0.5">{t("admin_manage_emp_sub")}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5 ml-auto opacity-40 group-hover:translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                    <Link href="/role/admin/listuser" className="flex items-center gap-5 p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-[#bca086]/10 text-[#bca086] flex items-center justify-center shrink-0 group-hover:bg-[#bca086]/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-black text-base text-slate-900 dark:text-white">{t("admin_manage_users")}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{t("admin_manage_users_sub")}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5 ml-auto text-slate-300 group-hover:text-[#bca086] group-hover:translate-x-1 transition-all">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activité récente</h2>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-zinc-600">Tous espaces</span>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 rounded bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                                        <div className="h-2 w-48 rounded bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                                    </div>
                                    <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : activity.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">{t("admin_no_activity")}</p>
                    ) : (
                        <div className="space-y-2">
                            {activity.map((item, idx) => {
                                const meta = ACTIVITY_META[item.type];
                                return (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        {/* Icône type */}
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                                            {meta.icon}
                                        </div>
                                        {/* Texte */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.title}</p>
                                            <p className="text-xs text-slate-400 font-medium truncate">{item.subtitle} — {item.date}</p>
                                        </div>
                                        {/* Badge statut */}
                                        {statusBadge(item.status)}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
