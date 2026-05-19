"use client";

// Composant cloche de notifications affiché dans l'en-tête de l'application.
// Affiche le nombre de notifications non lues et ouvre/ferme le menu déroulant.
// Se ferme automatiquement quand l'utilisateur clique en dehors du composant.

import React, { useState, useRef, useEffect } from "react";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "../context/NotificationsContext";

export default function NotificationBell() {
    // État d'ouverture/fermeture du menu déroulant des notifications
    const [isOpen, setIsOpen] = useState(false);
    // Référence DOM pour détecter les clics en dehors du composant
    const dropdownRef = useRef<HTMLDivElement>(null);
    // Récupération du nombre de notifications non lues et de la fonction "tout marquer lu"
    const { unreadCount, markAllAsRead } = useNotifications();

    // Ferme le dropdown quand l'utilisateur clique en dehors du composant
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        // Nettoyage de l'écouteur au démontage du composant
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Bascule l'état d'ouverture du dropdown
    const handleOpen = () => {
        setIsOpen(prev => !prev);
    };

    return (
        // Le ref permet de détecter les clics extérieurs pour fermer le dropdown
        <div className="relative" ref={dropdownRef}>
            {/* Bouton cloche — change de style selon l'état ouvert/fermé */}
            <button
                onClick={handleOpen}
                className={`p-2.5 rounded-xl border transition-all z-[101] relative ${isOpen
                    ? "bg-[#bca086] text-white border-[#bca086] shadow-lg shadow-[#bca086]/20 scale-110"
                    : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:text-[#bca086] dark:hover:text-[#bca086] hover:scale-110 shadow-sm"
                    }`}
                aria-label="Notifications"
            >
                <span className="relative inline-block">
                    {/* Icône de cloche */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {/* Badge rouge affiché uniquement s'il y a des notifications non lues.
                        Affiche "9+" si le nombre dépasse 9 pour éviter le débordement. */}
                    {unreadCount > 0 && (
                        <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-[9px] font-black border-2 transition-colors ${isOpen ? "bg-white text-[#bca086] border-[#bca086]" : "bg-rose-500 text-white border-white dark:border-zinc-900"}`}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </span>
            </button>

            {/* Affiche le menu déroulant uniquement si le bouton est ouvert */}
            {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} onMarkAllRead={markAllAsRead} />}
        </div>
    );
}
