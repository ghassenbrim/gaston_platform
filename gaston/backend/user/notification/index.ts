import { prisma } from "@/lib/prisma";

/**
 * Types de notifications supportés par l'application.
 * - "message"               : un nouveau message reçu
 * - "photo"                 : une photo ajoutée à la galerie de l'utilisateur
 * - "reservation_confirmed" : une réservation confirmée par l'admin
 * - "reservation_cancelled" : une réservation annulée
 * - "contract"              : un contrat ajouté à l'espace client
 * - "system"                : notification système générique (ex : mission assignée)
 */
export type NotifType =
    | "message"
    | "photo"
    | "reservation_confirmed"
    | "reservation_cancelled"
    | "contract"
    | "payment"
    | "planning"
    | "work_day"
    | "system";

/**
 * Interface représentant une notification formatée pour le frontend.
 */
export interface Notification {
    id: string;
    type: NotifType;
    content: string;         // Texte de la notification
    refId: string | null;    // Identifiant de la ressource liée (message, photo, réservation…)
    isRead: boolean;         // Indique si la notification a été lue
    createdAt: string;       // Date de création au format ISO 8601
}

/**
 * Récupère les 50 dernières notifications d'un utilisateur, triées du plus récent au plus ancien.
 *
 * @param userId - L'identifiant de l'utilisateur.
 * @returns Un tableau de notifications formatées, ou un tableau vide en cas d'erreur.
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const rows = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50, // Limite à 50 notifications pour éviter des réponses trop lourdes
        });
        // Transformation des enregistrements Prisma en objets Notification typés
        return rows.map(r => ({
            id: r.id,
            type: r.type as NotifType,
            content: r.content,
            refId: r.refId ?? null,
            isRead: r.isRead,
            createdAt: r.createdAt.toISOString(),
        }));
    } catch (error) {
        console.error("Erreur getNotifications:", error);
        return [];
    }
};

/**
 * Marque une notification spécifique comme lue.
 * Utilisé lorsqu'un utilisateur clique sur une notification.
 *
 * @param notificationId - L'identifiant de la notification à marquer comme lue.
 * @returns { success: true } ou { success: false } selon le résultat.
 */
export const markAsRead = async (notificationId: string, userId: string) => {
    try {
        await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur markAsRead:", error);
        return { success: false };
    }
};

/**
 * Marque toutes les notifications non lues d'un utilisateur comme lues.
 * Utilisé lorsqu'un utilisateur clique sur "Tout marquer comme lu".
 *
 * @param userId - L'identifiant de l'utilisateur.
 * @returns { success: true } ou { success: false } selon le résultat.
 */
export const markAllAsRead = async (userId: string) => {
    try {
        // Met à jour uniquement les notifications encore non lues (isRead: false)
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur markAllAsRead:", error);
        return { success: false };
    }
};

/**
 * Crée une nouvelle notification pour un utilisateur.
 * Fonction utilitaire appelée par d'autres modules (messages, réservations, photos…).
 *
 * @param userId  - L'identifiant du destinataire de la notification.
 * @param type    - Le type de notification (voir NotifType).
 * @param content - Le texte affiché dans la notification.
 * @param refId   - (Optionnel) L'identifiant de la ressource liée pour la navigation.
 */
export const createNotification = async (
    userId: string,
    type: NotifType,
    content: string,
    refId?: string
) => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                content,
                // Si refId n'est pas fourni, on stocke null en base
                refId: refId ?? null
            },
        });
    } catch (error) {
        console.error("Erreur createNotification:", error);
    }
};
