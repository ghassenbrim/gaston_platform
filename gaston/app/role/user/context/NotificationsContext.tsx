"use client";

// Contexte global pour la gestion des notifications de l'utilisateur.
// Gère le chargement, le polling automatique, le marquage comme lu
// et expose l'état des notifications à tous les composants enfants.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// Types de notifications possibles dans l'application
export type NotifType =
    | "message"               // Nouveau message reçu
    | "photo"                 // Nouvelle photo ajoutée
    | "reservation_confirmed" // Réservation confirmée par l'admin
    | "reservation_cancelled" // Réservation annulée
    | "contract"              // Nouveau contrat disponible
    | "payment"
    | "planning"
    | "work_day"
    | "system";               // Notification système

// Structure d'une notification applicative
export interface AppNotification {
    id: string;
    type: NotifType;
    content: string;       // Texte affiché à l'utilisateur
    refId: string | null;  // Référence à l'entité liée (ex: ID de message)
    isRead: boolean;
    createdAt: string;     // Date ISO de création
}

// Interface exposée par le contexte
interface NotificationsContextType {
    notifications: AppNotification[];
    unreadCount: number;                  // Nombre de notifications non lues
    loading: boolean;
    markAsRead: (id: string) => void;     // Marque une notification comme lue
    markAllAsRead: () => void;            // Marque toutes les notifications comme lues
    refresh: () => void;                  // Force un rechargement depuis l'API
}

// Création du contexte (undefined par défaut pour forcer l'usage du Provider)
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Fournisseur du contexte : gère l'état des notifications et le polling
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    // Référence à l'intervalle de polling pour pouvoir le nettoyer
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Récupère les notifications depuis l'API.
     * Utilise useCallback pour éviter les re-renders inutiles lors du polling.
     */
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/user/notifications");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setNotifications(data);
            }
        } catch {
            // Erreur silencieuse : le polling réessaiera automatiquement
        } finally {
            setLoading(false);
        }
    }, []);

    // Chargement initial + polling toutes les 30 secondes
    // Le nettoyage de l'intervalle est effectué au démontage du composant
    useEffect(() => {
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, 30_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchNotifications]);

    /**
     * Marque une notification spécifique comme lue.
     * Applique une mise à jour optimiste puis synchronise avec le serveur.
     * En cas d'erreur, annule la mise à jour optimiste (rollback).
     */
    const markAsRead = useCallback((id: string) => {
        // Mise à jour optimiste de l'interface
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        fetch("/api/user/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        }).catch(() => {
            // Rollback en cas d'erreur réseau
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: false } : n)
            );
        });
    }, []);

    /**
     * Marque toutes les notifications non lues comme lues.
     * Ne fait rien si tout est déjà lu (optimisation).
     * Applique une mise à jour optimiste avec rollback en cas d'erreur.
     */
    const markAllAsRead = useCallback(() => {
        const hadUnread = notifications.some(n => !n.isRead);
        // Si tout est déjà lu, on ne fait rien
        if (!hadUnread) return;

        // Mise à jour optimiste : toutes les notifications passent à isRead: true
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        fetch("/api/user/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
        }).catch(() => {
            // Rollback : recharge les données depuis le serveur
            fetchNotifications();
        });
    }, [notifications, fetchNotifications]);

    // Calcul du nombre de notifications non lues (dérivé de l'état)
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refresh: fetchNotifications,
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

/**
 * Hook personnalisé pour accéder au contexte des notifications.
 * Lève une erreur si utilisé en dehors d'un NotificationsProvider.
 */
export const useNotifications = () => {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
    return ctx;
};
