"use client";

// Page tableau de bord de l'espace client.
// Affiche un message de bienvenue personnalisé et une grille de raccourcis rapides
// vers les différentes sections de l'espace utilisateur.

import React, { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { fetchUserProfileAction } from "../settingsuser/actions";

// Police Playfair Display pour les titres élégants
const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

export default function UserDashboard() {
    // Nom de l'utilisateur affiché dans le message de bienvenue
    const [userName, setUserName] = useState("Utilisateur");

    useEffect(() => {
        // Tentative de lecture du nom depuis le data-attribute du document
        // (mis en cache par le layout pour éviter un appel API supplémentaire)
        const cachedName = document.documentElement.dataset.userName;
        if (cachedName) setUserName(cachedName);

        // Chargement du profil complet depuis l'API pour s'assurer d'avoir le nom à jour
        async function loadProfile() {
            try {
                const result = await fetchUserProfileAction();
                if (result.success && 'user' in result && result.user) {
                    setUserName(result.user.name || "Utilisateur");
                }
            } catch { /* Erreur silencieuse, le nom par défaut est déjà affiché */ }
        }
        loadProfile();
    }, []);

    // Liste des raccourcis rapides affichés dans la grille du dashboard.
    // La propriété `accent` désigne le raccourci principal mis en avant (Nouvelle Réservation).
    const quickLinks = [
        {
            href: "/role/user/rendezvous",
            label: "Mes Rendez-Vous",
            desc: "Voir et gérer vos réservations",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
            ),
            accent: false,
        },
        {
            href: "/role/user/mesphotos",
            label: "Mes Photos",
            desc: "Accéder à votre galerie",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            ),
            accent: false,
        },
        {
            href: "/role/user/messagebox",
            label: "Messagerie",
            desc: "Discutez avec Gaston",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
            ),
            accent: false,
        },
        {
            href: "/role/user/contrat",
            label: "Mon Contrat",
            desc: "Consulter votre contrat",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            ),
            accent: false,
        },
        {
            href: "/role/user/favoris",
            label: "Mes Favoris",
            desc: "Photos sauvegardées",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            ),
            accent: false,
        },
        {
            // Raccourci mis en avant (style accentué) pour créer une nouvelle réservation
            href: "/role/user/rendezvous/new-reservation",
            label: "Nouvelle Réservation",
            desc: "Réserver une séance photo",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
            ),
            accent: true, // Ce lien utilise le style accentué (fond doré)
        },
    ];

    return (
        <div className="p-6 md:p-12 lg:p-20 space-y-10">
            {/* En-tête de bienvenue avec le nom de l'utilisateur */}
            <header className="space-y-3">
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#bca086]/10 text-[#bca086] text-[10px] font-black uppercase tracking-[0.2em]">
                    Espace Client
                </div>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                    Bienvenue, {userName}
                </h1>
                <p className="text-lg text-slate-500 font-light max-w-xl leading-relaxed">
                    Gérez vos réservations, consultez vos photos et suivez vos services.
                </p>
            </header>

            {/* Grille de raccourcis rapides vers les sections principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`group flex items-center gap-4 p-6 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                            link.accent
                                ? "bg-[#bca086] text-white border-[#bca086] shadow-lg shadow-[#bca086]/20"
                                : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 hover:border-[#bca086]/30"
                        }`}
                    >
                        {/* Icône du raccourci avec fond adapté selon le style (accent ou normal) */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            link.accent
                                ? "bg-white/20"
                                : "bg-[#bca086]/10 text-[#bca086]"
                        }`}>
                            {link.icon}
                        </div>
                        <div className="min-w-0">
                            <p className={`font-bold text-sm leading-tight ${link.accent ? "text-white" : "text-slate-900 dark:text-white group-hover:text-[#bca086] transition-colors"}`}>
                                {link.label}
                            </p>
                            <p className={`text-xs mt-0.5 ${link.accent ? "text-white/70" : "text-slate-400"}`}>
                                {link.desc}
                            </p>
                        </div>
                        {/* Flèche animée qui se déplace à droite au survol */}
                        <svg className={`w-4 h-4 ml-auto shrink-0 transition-transform group-hover:translate-x-1 ${link.accent ? "text-white/70" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                ))}
            </div>
        </div>
    );
}
