// Composant layout principal de l'espace administrateur.
// Il encapsule toutes les pages admin avec une barre latérale de navigation,
// un en-tête avec profil et contrôles (thème, langue, déconnexion),
// et gère l'état d'effondrement de la sidebar ainsi que le menu mobile.
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { useSessionSync } from "@/hooks/useSessionSync";
import LogoutButton from "../welcompage/LogoutButton";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageContext";

// Chargement de la police Playfair Display (italique et normal) depuis Google Fonts
const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

/**
 * Retourne la configuration des éléments de navigation de la barre latérale admin.
 * Chaque entrée possède une clé de traduction et un chemin href.
 */
const getNavIconsConfig = () => [
    { key: "dashboard", href: "/role/admin/dashboard" },
    { key: "employees", href: "/role/admin/employes" },
    { key: "users", href: "/role/admin/listuser" },
    { key: "planning", href: "/role/admin/planning" },
    { key: "reservations", href: "/role/admin/reservations" },
    { key: "packs", href: "/role/admin/packs" },
    { key: "homepage", href: "/role/admin/pageaccueil" },
    { key: "messaging", href: "/role/admin/admessagebox" },
    { key: "reviews", href: "/role/admin/avis_client" },
    { key: "settings", href: "/role/admin/settings" },
];

/**
 * Composant qui rend l'icône SVG correspondant à un index donné.
 * Les icônes sont stockées dans un objet indexé par numéro (0 à 7).
 */
const IconComponent = ({ icon }: { icon: number }) => {
    const icons: { [key: number]: React.JSX.Element } = {
        0: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
        ),
        1: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
        ),
        2: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
        ),
        3: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008Z" />
            </svg>
        ),
        4: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
            </svg>
        ),
        5: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        ),
        6: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
        ),
        7: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
        ),
        8: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.103l.77-.539c.452-.315 1.066-.234 1.428.189l.774.894c.356.411.336 1.02-.047 1.408l-.633.642c-.288.292-.37.722-.213 1.095.158.373.513.627.917.653l.9.06c.544.036.953.51.953 1.054v1.093c0 .544-.409 1.018-.953 1.054l-.901.06c-.403.027-.758.28-.917.653-.157.373-.075.803.213 1.095l.633.642c.383.388.403.997.047 1.408l-.774.894c-.362.423-.976.504-1.428.189l-.77-.539c-.35-.245-.807-.267-1.205-.103-.396.166-.71.506-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.103l-.77.539c-.453.315-1.067.234-1.429-.189l-.774-.894c-.355-.411-.336-1.02.047-1.408l.633-.642c.288-.292.37-.722.213-1.095-.158-.373-.513-.627-.917-.653l-.9-.06c-.544-.036-.953-.51-.953-1.054v-1.093c0-.544.409-1.018.953-1.054l.901-.06c.403-.027.758-.28.917-.653.157-.373.075-.803-.213-1.095l-.633-.642c-.383-.388-.403-.997-.047-1.408l.774-.894c.362-.423.976-.504 1.428-.189l.77.539c.35.245.807.267 1.205.103.397-.166.71-.506.78-.93l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
        ),
    };
    // Retourne l'icône demandée ou l'icône 0 par défaut si l'index n'existe pas
    return icons[icon] || icons[0];
};

/**
 * Layout principal de l'espace administrateur.
 * Gère :
 * - La synchronisation de session (rôle ADMIN)
 * - La sidebar avec navigation traduite
 * - Le mode sombre / clair (persisté dans localStorage)
 * - L'état réduit / étendu de la barre latérale (persisté dans localStorage)
 * - Le menu hamburger sur mobile
 * - Le chargement du profil admin (avatar, nom)
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    // Synchronise la session côté client et vérifie le rôle ADMIN
    useSessionSync("ADMIN");
    // Chemin actuel pour déterminer l'élément de navigation actif
    const pathname = usePathname();

    // État du mode sombre
    const [isDarkMode, setIsDarkMode] = useState(false);
    // État de la sidebar : réduite (icônes seules) ou étendue
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Contrôle l'ouverture du menu mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Avatar et nom de l'admin chargés depuis l'API
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [adminName, setAdminName] = useState("Gaston Admin");

    /**
     * Construit les éléments de navigation avec titres et descriptions traduits.
     * Mémoïsé pour éviter de reconstruire le tableau à chaque rendu.
     */
    const navItems = useMemo(() => {
        const config = getNavIconsConfig();
        return config.map((item, index) => {
            const titleStr = t(`nav_${item.key}` as any);
            const descStr = t(`nav_${item.key}_desc` as any);
            return {
                title: titleStr === `nav_${item.key}` ? (item.key === 'reviews' ? 'Avis Clients' : item.key === 'packs' ? 'Packs & tarifs' : titleStr) : titleStr,
                description: descStr === `nav_${item.key}_desc` ? (item.key === 'reviews' ? 'Gérer les témoignages' : item.key === 'packs' ? 'Modifier les devis' : descStr) : descStr,
                icon: <IconComponent icon={index} />,
                href: item.href,
            };
        });
    }, [t]);

    // Chargement des informations du profil administrateur (avatar, nom)
    useEffect(() => {
        fetch("/api/admin/settings")
            .then(r => r.json())
            .then(data => {
                if (data.avatar) setAdminAvatar(data.avatar);
                if (data.name) setAdminName(data.name);
            })
            .catch(() => {});
    }, []);

    // Initialisation du thème et de l'état de la sidebar depuis localStorage ou les préférences système
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const savedSidebar = localStorage.getItem("adminSidebarCollapsed");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        // Priorité : thème sauvegardé, sinon préférence système
        const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
        requestAnimationFrame(() => {
            setIsDarkMode(isDark);
            if (isDark) document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
        });
        // Restaure l'état d'effondrement de la sidebar
        if (savedSidebar === "true") requestAnimationFrame(() => setIsCollapsed(true));
    }, []);

    // Bloque le défilement du body lorsque le menu mobile est ouvert
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobileMenuOpen]);

    /**
     * Bascule entre le mode sombre et le mode clair.
     * Met à jour la classe CSS sur <html> et persiste le choix dans localStorage.
     */
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

    /**
     * Bascule l'état réduit / étendu de la barre latérale.
     * Persiste le nouvel état dans localStorage.
     */
    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("adminSidebarCollapsed", newState.toString());
    };

    return (
        <div className="h-screen h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
            {/* Overlay semi-transparent affiché derrière le menu mobile ouvert */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* ── Barre latérale de navigation ── */}
            <aside
                className={`h-screen h-[100dvh] bg-slate-50 dark:bg-zinc-900 border-r border-slate-200/60 dark:border-white/10 p-6 md:p-8 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group/sidebar fixed md:relative z-50 md:z-auto ${
                    isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
                } ${isCollapsed ? "w-24 md:w-28" : "w-72 md:w-80 lg:w-96"}`}
            >
                {/* Bouton pour réduire ou étendre la sidebar (visible sur desktop) */}
                <button
                    onClick={toggleSidebar}
                    className={`absolute -right-4 top-10 w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center text-slate-400 hover:text-[#bca086] transition-all duration-300 z-[60] hover:scale-110 active:scale-95 group-hover/sidebar:opacity-100 opacity-0 md:opacity-100 ${
                        isCollapsed ? "rotate-0" : ""
                    } ${isMobileMenuOpen ? "animate-in slide-in-from-right duration-500 delay-200" : ""}`}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {/* La flèche pivote de 180° quand la sidebar est réduite */}
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

                <div className="flex flex-col h-full overflow-y-auto overscroll-contain no-scrollbar">
                    {/* Bouton de fermeture du menu mobile (visible uniquement sur mobile) */}
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

                    {/* Logo / branding "Admin" — redirige vers le dashboard */}
                    <Link href="/role/admin/dashboard" className={`mb-12 flex items-center transition-all duration-500 group/brand ${isCollapsed ? "justify-center" : "gap-1 pl-4"} ${
                        isMobileMenuOpen ? "animate-in slide-in-from-top duration-700" : ""
                    }`}>
                        <div className="w-12 h-12 rounded-2xl bg-[#bca086] flex items-center justify-center text-white shadow-xl shadow-[#bca086]/20 shrink-0 transition-transform duration-500 group-hover/brand:rotate-6 border-2 border-white dark:border-slate-800">
                            <span className="font-black text-xl tracking-tighter">AD</span>
                        </div>
                        {/* Texte masqué quand la sidebar est réduite */}
                        <div className={`transition-all duration-500 flex flex-col ${isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100 ml-2"}`}>
                            <h1 className={`${playfair.className} text-2xl italic tracking-tighter text-[#bca086] leading-none mb-1 group-hover/brand:opacity-80 transition-opacity`}>Admin</h1>
                            <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] whitespace-nowrap">Gaston Platform</p>
                        </div>
                    </Link>

                    {/* ── Éléments de navigation ── */}
                    <nav className="flex flex-col gap-3 mb-auto">
                        {navItems.map((item, index) => {
                            // Détermine si le lien est actif (chemin exact ou sous-chemin)
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
                                        // Délai d'animation en cascade lors de l'ouverture mobile
                                        animationDelay: isMobileMenuOpen ? `${index * 100}ms` : "0ms",
                                        animationFillMode: "both"
                                    }}
                                >
                                    {/* Icône de l'élément de navigation */}
                                    <div className={`bg-[#bca086] ${isCollapsed ? "w-11 h-11 md:w-12 md:h-12" : "w-12 h-12 mr-4"} shrink-0 rounded-xl flex items-center justify-center text-white shadow-md shadow-[#bca086]/10 group-hover:scale-110 transition-all duration-500`}>
                                        {item.icon}
                                    </div>

                                    {/* Infobulle affichée au survol quand la sidebar est réduite */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-6 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-xl">
                                            {item.title}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                        </div>
                                    )}

                                    {/* Titre et description (masqués quand la sidebar est réduite) */}
                                    <div className={`overflow-hidden transition-all duration-500 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                                        <div className="min-w-[150px] ml-1">
                                            <h3 className={`text-lg font-bold leading-none mb-1 transition-colors duration-300 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-[#bca086]"}`}>
                                                {item.title}
                                            </h3>
                                            <p className="text-xs opacity-40 font-medium leading-tight whitespace-nowrap truncate">{item.description}</p>
                                        </div>
                                    </div>

                                    {/* Indicateur visuel de page active (trait vertical animé) */}
                                    {isActive && !isCollapsed && (
                                        <div className="absolute right-4 w-1.5 h-6 bg-[#bca086] rounded-full animate-pulse"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Badge "Connecté en tant qu'Administrateur" en bas de la sidebar */}
                    {!isCollapsed && (
                        <div className="mt-8 p-4 rounded-2xl bg-[#bca086]/5 border border-[#bca086]/10">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{t("connected_as")}</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t("administrator")}</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── Zone de contenu principal ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* En-tête avec bouton hamburger (mobile), nom/avatar admin, thème, langue, déconnexion */}
                <header className="h-20 border-b border-slate-100 dark:border-white/10 flex items-center justify-between px-4 md:px-10 bg-background/80 backdrop-blur-xl z-50 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Bouton hamburger animé (3 barres → croix) visible uniquement sur mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-110 transition-all duration-300 text-slate-400 relative overflow-hidden"
                            aria-label="Toggle menu"
                        >
                            <div className="relative w-5 h-5">
                                {/* Trois barres qui se transforment en croix selon l'état du menu */}
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:inline">Espace</span>
                        <span className="px-3 py-1 rounded-full bg-[#bca086] text-white text-[9px] font-black uppercase tracking-widest hidden sm:inline">Administration</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Nom et avatar de l'admin (visible sur grand écran) */}
                        <div className="hidden lg:flex items-center gap-3 text-right">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wide leading-none">{adminName}</h2>
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mt-1">Super Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#bca086] flex items-center justify-center text-white shadow-md shadow-[#bca086]/20 border-2 border-white dark:border-black overflow-hidden shrink-0">
                                {adminAvatar
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={adminAvatar} alt="admin" className="w-full h-full object-cover" />
                                    : <span className="font-bold text-sm">GA</span>
                                }
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block"></div>
                        <div className="flex items-center gap-3">
                            {/* Bouton bascule thème clair/sombre */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-110 transition-all text-slate-400 dark:text-amber-400"
                                aria-label="Toggle Theme"
                            >
                                {/* Icône soleil en mode sombre, lune en mode clair */}
                                {isDarkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-4.773-1.591-1.591M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                    </svg>
                                )}
                            </button>
                            {/* Sélecteur de langue compact */}
                            <LanguageSwitcherCompact />
                            {/* Bouton de déconnexion */}
                            <LogoutButton
                                className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm hover:scale-110 transition-all text-slate-400 hover:text-rose-500"
                                aria-label="Logout"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                </svg>
                            </LogoutButton>
                        </div>
                    </div>
                </header>

                {/* Zone de rendu des pages enfants */}
                <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}
