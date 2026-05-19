"use client";

// Menu déroulant des notifications affiché sous la cloche dans l'en-tête.
// Affiche les 4 dernières notifications, permet de les marquer comme lues
// et de naviguer vers la page correspondante en cliquant sur une notification.

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useNotifications, AppNotification, NotifType } from "../context/NotificationsContext";

/**
 * Retourne l'URL de destination selon le type de notification et le rôle de l'utilisateur.
 * Permet à la fois aux utilisateurs et aux employés d'utiliser ce composant.
 */
function getNotifLink(type: NotifType, pathname: string): string | null {
    // Détecte si l'utilisateur est un employé en fonction du chemin URL
    const isEmployee = pathname.startsWith("/role/employeer");

    if (type === "message") return isEmployee ? "/role/employeer/chatadmin" : "/role/user/messagebox";
    if (type === "reservation_confirmed" || type === "reservation_cancelled") return isEmployee ? "/role/employeer/planning" : "/role/user/rendezvous";
    if (type === "photo") return isEmployee ? "/role/employeer/dashboard" : "/role/user/mesphotos";
    if (type === "contract") return isEmployee ? "/role/employeer/paiments" : "/role/user/dashboard";
    if (type === "system") return isEmployee ? "/role/employeer/planning" : null;

    return null;
}

// ─── Icônes par type de notification ──────────────────────────────────────────
// Composant qui retourne l'icône colorée correspondant au type de notification
function NotifIcon({ type }: { type: NotifType }) {
    // Classes de base communes à toutes les icônes
    const base = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";

    if (type === "message") return (
        <div className={`${base} bg-[#bca086] text-white`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </div>
    );
    if (type === "photo") return (
        <div className={`${base} bg-amber-100 dark:bg-amber-900/30 text-amber-600`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
    );
    if (type === "reservation_confirmed") return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
    );
    if (type === "reservation_cancelled") return (
        <div className={`${base} bg-red-100 dark:bg-red-900/30 text-red-500`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
    );
    if (type === "contract") return (
        <div className={`${base} bg-rose-100 dark:bg-rose-900/30 text-rose-500`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
    );
    // Icône par défaut pour les notifications système
    return (
        <div className={`${base} bg-slate-100 dark:bg-zinc-800 text-slate-500`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </div>
    );
}

/**
 * Formate une date ISO en texte relatif lisible (ex: "À l'instant", "5 min", "2 h").
 * Affiche la date complète pour les notifications de plus d'une semaine.
 */
function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} j`;
    // Pour les notifications anciennes, affiche la date complète
    return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Props du composant dropdown
export default function NotificationDropdown({
    onClose,
    onMarkAllRead,
}: {
    onClose: () => void;       // Appelée pour fermer le dropdown
    onMarkAllRead: () => void; // Appelée pour tout marquer comme lu
}) {
    const { notifications, unreadCount, markAsRead, loading } = useNotifications();
    const router   = useRouter();
    const pathname = usePathname();
    // Affiche uniquement les 4 notifications les plus récentes dans le dropdown
    const recent   = notifications.slice(0, 4);

    return (
        <div className="absolute top-full mt-4 w-80 md:w-96 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top md:origin-top-right max-w-[calc(100vw-2rem)] md:max-w-none right-0 md:right-0 left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0">
            {/* En-tête du dropdown avec le compteur et le bouton "Tout lire" */}
            <header className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                <h3 className="font-black text-sm uppercase tracking-wider">Notifications</h3>
                {unreadCount > 0 && (
                    <div className="flex items-center gap-2">
                        {/* Badge indiquant le nombre de nouvelles notifications */}
                        <span className="px-2.5 py-0.5 bg-[#bca086] text-white text-[10px] font-bold rounded-full">
                            {unreadCount} NOUVELLE{unreadCount > 1 ? "S" : ""}
                        </span>
                        {/* Bouton pour tout marquer comme lu */}
                        <button
                            onClick={onMarkAllRead}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#bca086] transition"
                            title="Tout marquer comme lu"
                        >
                            Tout lire
                        </button>
                    </div>
                )}
            </header>

            {/* Zone scrollable contenant la liste des notifications récentes */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    // Indicateur de chargement
                    <div className="p-8 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#bca086] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recent.length === 0 ? (
                    // Message affiché quand il n'y a aucune notification
                    <div className="p-8 text-center text-slate-400">
                        <svg className="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <p className="text-xs font-bold uppercase tracking-widest">Aucune notification</p>
                    </div>
                ) : (
                    // Liste des 4 dernières notifications
                    recent.map((notif: AppNotification) => {
                        const link = getNotifLink(notif.type, pathname);
                        return (
                            <div
                                key={notif.id}
                                onClick={() => {
                                    // Marque comme lu si nécessaire, puis navigue vers la page liée
                                    if (!notif.isRead) markAsRead(notif.id);
                                    if (link) { onClose(); router.push(link); }
                                }}
                                className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0 ${notif.isRead ? "opacity-55" : ""}`}
                            >
                                {/* Icône colorée selon le type de notification */}
                                <NotifIcon type={notif.type} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-1">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-relaxed">{notif.content}</p>
                                        {/* Horodatage relatif */}
                                        <span className="text-[9px] text-slate-400 shrink-0 mt-0.5">{timeAgo(notif.createdAt)}</span>
                                    </div>
                                    {/* Invite à ouvrir si un lien est disponible */}
                                    {link && <p className="text-[9px] font-black uppercase tracking-widest text-[#bca086]/70 mt-0.5">Appuyer pour ouvrir →</p>}
                                </div>
                                {/* Point de couleur indiquant que la notification n'est pas lue */}
                                {!notif.isRead && (
                                    <div className="w-1.5 h-1.5 bg-[#bca086] rounded-full shrink-0 mt-2" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pied de page avec lien vers la page complète des notifications */}
            <footer className="p-4 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
                <Link
                    href={pathname.startsWith("/role/employeer") ? "/role/employeer/notification" : "/role/user/notification"}
                    onClick={onClose}
                    className="block text-center text-xs font-black uppercase tracking-widest text-[#bca086] hover:underline"
                >
                    Voir toutes les notifications →
                </Link>
            </footer>
        </div>
    );
}
