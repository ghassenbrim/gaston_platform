"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsProvider } from "../user/context/NotificationsContext";
import NotificationBell from "../user/notification/NotificationBell";
import { useSessionSync } from "@/hooks/useSessionSync";
import LogoutButton from "../welcompage/LogoutButton";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const dashboardItems = [
    {
        title: "Mon Dashboard",
        description: "Vue d'ensemble de votre activité.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6v12m6-12v12m6-12v12m6-12v12" />
            </svg>
        ),
        href: "/role/employeer/dashboard",
        color: "bg-[#bca086]",
    },
    {
        title: "Jours travaillés",
        description: "Suivi de vos heures et journées.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
        ),
        href: "/role/employeer/jourstravailles",
        color: "bg-[#bca086]",
    },
    {
        title: "Planning",
        description: "Vos prochaines missions.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        href: "/role/employeer/planning",
        color: "bg-[#bca086]",
    },
    {
        title: "Paiements",
        description: "Historique de vos rémunérations.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
        ),
        href: "/role/employeer/paiments",
        color: "bg-[#bca086]",
    },
    {
        title: "Messagerie Admin",
        description: "Contactez l'administration.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-6.75 3h1.5l2.25 2.25 2.25-2.25h7.5a2.25 2.25 0 002.25-2.25V4.5a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 004.5 20.25Z" />
            </svg>
        ),
        href: "/role/employeer/chatadmin",
        color: "bg-[#bca086]",
    },
    {
        title: "Paramètres",
        description: "Gérez votre compte employé.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.103l.77-.539c.452-.315 1.066-.234 1.428.189l.774.894c.356.411.336 1.02-.047 1.408l-.633.642c-.288.292-.37.722-.213 1.095.158.373.513.627.917.653l.9.06c.544.036.953.51.953 1.054v1.093c0 .544-.409 1.018-.953 1.054l-.901.06c-.403.027-.758.28-.917.653-.157.373-.075.803.213 1.095l.633.642c.383.388.403.997.047 1.408l-.774.894c-.362.423-.976.504-1.428.189l-.77-.539c-.35-.245-.807-.267-1.205-.103-.396.166-.71.506-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.103l-.77.539c-.453.315-1.067.234-1.429-.189l-.774-.894c-.355-.411-.336-1.02.047-1.408l.633-.642c.288-.292.37-.722.213-1.095-.158-.373-.513-.627-.917-.653l-.9-.06c-.544-.036-.953-.51-.953-1.054v-1.093c0-.544.409-1.018.953-1.054l.901-.06c.403-.027.758-.28.917-.653.157-.373.075-.803-.213-1.095l-.633-.642c-.383-.388-.403-.997-.047-1.408l.774-.894c.362-.423.976-.504 1.428-.189l.77.539c.35.245.807.267 1.205.103.397-.166.71-.506.78-.93l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        href: "/role/employeer/settingsemployee",
        color: "bg-[#bca086]",
    },
];

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { t } = useTranslation();
    useSessionSync("EMPLOYEE");
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [employeeName, setEmployeeName] = useState<string>("Employé");
    const [initials, setInitials] = useState<string>("E");
    const [employeeAvatar, setEmployeeAvatar] = useState<string | null>(null);

    const dashboardItems = useMemo(() => [
        {
            title: t("nav_my_dashboard"),
            description: t("nav_my_dashboard_desc"),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6v12m6-12v12m6-12v12m6-12v12" />
                </svg>
            ),
            href: "/role/employeer/dashboard",
            color: "bg-[#bca086]",
        },
        {
            title: t("nav_worked_days"),
            description: t("nav_worked_days_desc"),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
            ),
            href: "/role/employeer/jourstravailles",
            color: "bg-[#bca086]",
        },
        {
            title: t("nav_planning"),
            description: t("nav_planning_desc"),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: "/role/employeer/planning",
            color: "bg-[#bca086]",
        },
        {
            title: t("nav_payments"),
            description: t("nav_payments_desc"),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
            ),
            href: "/role/employeer/paiments",
            color: "bg-[#bca086]",
        },
        {
            title: t("nav_admin_msg"),
            description: t("nav_admin_msg_desc"),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-6.75 3h1.5l2.25 2.25 2.25-2.25h7.5a2.25 2.25 0 002.25-2.25V4.5a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 004.5 20.25Z" />
                </svg>
            ),
            href: "/role/employeer/chatadmin",
            color: "bg-[#bca086]",
        },
        {
            title: t("nav_settings_emp"),
            description: t("nav_settings_emp_desc"),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.103l.77-.539c.452-.315 1.066-.234 1.428.189l.774.894c.356.411.336 1.02-.047 1.408l-.633.642c-.288.292-.37.722-.213 1.095.158.373.513.627.917.653l.9.06c.544.036.953.51.953 1.054v1.093c0 .544-.409 1.018-.953 1.054l-.901.06c-.403.027-.758.28-.917.653-.157.373-.075.803.213 1.095l.633.642c.383.388.403.997.047 1.408l-.774.894c-.362.423-.976.504-1.428.189l-.77-.539c-.35-.245-.807-.267-1.205-.103-.396.166-.71.506-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.103l-.77.539c-.453.315-1.067.234-1.429-.189l-.774-.894c-.355-.411-.336-1.02.047-1.408l.633-.642c.288-.292.37-.722.213-1.095-.158-.373-.513-.627-.917-.653l-.9-.06c-.544-.036-.953-.51-.953-1.054v-1.093c0-.544.409-1.018.953-1.054l.901-.06c.403-.027.758-.28.917-.653.157-.373.075-.803-.213-1.095l-.633-.642c-.383-.388-.403-.997-.047-1.408l.774-.894c.362-.423.976-.504 1.428-.189l.77.539c.35.245.807.267 1.205.103.397-.166.71-.506.78-.93l.15-.894z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            href: "/role/employeer/settingsemployee",
            color: "bg-[#bca086]",
        },
    ], [t]);

    // Fetch employee profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/employeer/settingsemployee", { cache: "no-store" });
                const result = await response.json();
                
                if (!response.ok) {
                    console.error("[EmployeeLayout] Erreur API employeur:", response.status, result);
                    if (response.status === 401) {
                        // Non authentifié, rediriger vers login
                        window.location.href = "/role/welcompage/signe_in";
                    } else if (response.status === 404) {
                        console.warn("[EmployeeLayout] Profil employé non trouvé (404). L'admin doit créer le profil.");
                    }
                    return;
                }
                
                if (result.success && result.data) {
                    const { firstName, lastName } = result.data;
                    const fullName = `${firstName} ${lastName}`;
                    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                    setEmployeeName(fullName);
                    setInitials(initials);
                    setEmployeeAvatar(result.data.user?.avatar || null);
                } else {
                    console.error("[EmployeeLayout] Réponse API invalide:", result);
                }
            } catch (error) {
                console.error("[EmployeeLayout] Erreur chargement profil:", error);
            }
        };

        fetchProfile();
    }, []);

    // Initial check for system preference or storage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const savedSidebar = localStorage.getItem("sidebarCollapsed");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        // Theme initialization
        const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
        requestAnimationFrame(() => {
            setIsDarkMode(isDark);
            if (isDark) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        });

        // Sidebar initialization
        if (savedSidebar === "true") {
            requestAnimationFrame(() => setIsCollapsed(true));
        }
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobileMenuOpen]);

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        if (newTheme) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebarCollapsed", newState.toString());
    };

    return (
        <NotificationsProvider>
        <div className="h-screen h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`h-screen h-[100dvh] bg-slate-50 dark:bg-zinc-900 border-r border-slate-200/60 dark:border-white/10 p-6 md:p-8 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group/sidebar fixed md:relative z-50 md:z-auto ${
                    isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
                } ${isCollapsed ? "w-24 md:w-28" : "w-72 md:w-80 lg:w-96"
                    }`}
            >
                {/* Professional Collapse Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className={`absolute -right-4 top-10 w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center text-slate-400 hover:text-[#bca086] transition-all duration-300 z-[60] hover:scale-110 active:scale-95 group-hover/sidebar:opacity-100 opacity-0 md:opacity-100 ${
                        isCollapsed ? "rotate-0" : ""
                    } ${isMobileMenuOpen ? "animate-in slide-in-from-right duration-500 delay-200" : ""}`}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`size-4 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${isCollapsed ? "rotate-180" : ""
                            }`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`md:hidden absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-700 z-10 transition-all duration-300 hover:scale-110 active:scale-95 ${
                            isMobileMenuOpen ? "animate-in zoom-in duration-500 delay-300" : ""
                        }`}
                        aria-label="Close menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Persistent Branding Logo Area */}
                    <div className={`mb-12 flex items-center transition-all duration-500 ${isCollapsed ? "justify-center" : "gap-1 pl-4"} ${
                        isMobileMenuOpen ? "animate-in slide-in-from-top duration-700" : ""
                    }`}>
                        <div className="w-12 h-12 rounded-2xl bg-[#bca086] flex items-center justify-center text-white shadow-xl shadow-[#bca086]/20 border-2 border-white dark:border-slate-800 shrink-0 transition-transform duration-500 hover:rotate-6">
                            <span className="font-black text-2xl tracking-tighter">EP</span>
                        </div>
                        <div className={`transition-all duration-500 flex flex-col ${isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100 ml-2"}`}>
                            <h1 className="text-3xl font-black tracking-tighter text-[#bca086] leading-none mb-1">Employé</h1>
                            <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] whitespace-nowrap">Platform</p>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex flex-col gap-3 mb-auto">
                        {dashboardItems.map((item, index) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`group relative flex items-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] border ${isActive
                                        ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none translate-x-1"
                                        : "border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                                        } ${isCollapsed ? "w-14 h-14 md:w-16 md:h-16 justify-center mx-auto" : "p-4 w-full"} ${
                                        isMobileMenuOpen ? `animate-in slide-in-from-left duration-500 fill-mode-backwards` : ""
                                    }`}
                                    style={{
                                        animationDelay: isMobileMenuOpen ? `${index * 100}ms` : "0ms",
                                        animationFillMode: "both"
                                    }}
                                >
                                    <div className={`${item.color} ${isCollapsed ? "w-11 h-11 md:w-12 md:h-12" : "w-12 h-12 mr-4"} shrink-0 rounded-xl flex items-center justify-center text-white shadow-md shadow-[#bca086]/10 group-hover:scale-110 transition-all duration-500`}>
                                        {item.icon}
                                    </div>

                                    {/* Tooltip for Collapsed State */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-6 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-xl">
                                            {item.title}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                        </div>
                                    )}

                                    {/* Text Content with Professional Fade */}
                                    <div className={`overflow-hidden transition-all duration-500 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 pointer-events-auto"}`}>
                                        <div className="min-w-[150px] ml-1">
                                            <h3 className={`text-lg font-bold leading-none mb-1 transition-colors duration-300 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-[#bca086]"}`}>
                                                {item.title}
                                            </h3>
                                            <p className="text-xs opacity-40 font-medium leading-tight whitespace-nowrap truncate">{item.description}</p>
                                        </div>
                                    </div>

                                    {/* Modern Active Indicator */}
                                    {isActive && !isCollapsed && (
                                        <div className="absolute right-4 w-1.5 h-6 bg-[#bca086] rounded-full animate-pulse"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Right Header */}
                <header className="h-20 border-b border-slate-100 dark:border-white/10 flex items-center justify-between md:justify-end px-4 md:px-10 bg-background/80 backdrop-blur-xl z-50 shrink-0">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-110 transition-all duration-300 text-slate-400 relative overflow-hidden"
                        aria-label="Toggle menu"
                    >
                        <div className="relative w-5 h-5">
                            {/* Hamburger lines */}
                            <span className={`absolute left-0 top-1 w-full h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                                isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                            }`}></span>
                            <span className={`absolute left-0 top-2 w-full h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                                isMobileMenuOpen ? "opacity-0" : ""
                            }`}></span>
                            <span className={`absolute left-0 bottom-1 w-full h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                                isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                            }`}></span>
                        </div>
                    </button>
                    <div className="flex items-center gap-6">
                        {/* User Profile Info */}
                        <div className="hidden lg:flex items-center gap-3 text-right">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wide leading-none">{employeeName}</h2>
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mt-1">Employé</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#bca086] flex items-center justify-center text-white shadow-md border-2 border-white dark:border-black overflow-hidden shrink-0">
                                {employeeAvatar
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={employeeAvatar} alt="avatar" className="w-full h-full object-cover" />
                                    : <span className="font-bold">{initials}</span>
                                }
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block"></div>

                        <div className="flex items-center gap-3">
                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-110 transition-all text-slate-400 dark:text-amber-400"
                                aria-label="Toggle Theme"
                            >
                                {isDarkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-4.773-1.591-1.591M12 18.75V21" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                    </svg>
                                )}
                            </button>

                            {/* Notifications */}
                            <NotificationBell />

                            {/* Language Switcher */}
                            <LanguageSwitcherCompact />

                            {/* Logout Button */}
                            <LogoutButton
                                className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-110 transition-all text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                </svg>
                            </LogoutButton>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
        </div>
        </NotificationsProvider>
    );
}
