import { prisma } from "@/lib/prisma";

/**
 * Récupère toutes les données nécessaires au tableau de bord d'un client.
 * Cela inclut :
 *  - Le prénom de bienvenue
 *  - Le prochain rendez-vous confirmé (le plus proche dans le futur)
 *  - Des statistiques : réservations actives, messages reçus, notifications non lues
 *
 * @param userId - L'identifiant de l'utilisateur connecté.
 * @returns Un objet contenant les données du dashboard, ou null en cas d'erreur.
 */
export const getUserDashboardData = async (userId: string) => {
    try {
        // Récupération de l'utilisateur pour obtenir son nom et son email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                // On peut ajouter des relations si on en crée (ex: Favoris, Photos)
            }
        });

        // Recherche du prochain rendez-vous confirmé à venir pour cet utilisateur
        const nextRendezVous = await prisma.reservation.findFirst({
            where: {
                clientEmail: user?.email,
                date: { gte: new Date() }, // Uniquement les dates futures (>= aujourd'hui)
                status: "CONFIRMED"         // Uniquement les réservations confirmées
            },
            orderBy: { date: 'asc' } // On veut le plus proche, donc tri croissant
        });

        return {
            // On extrait le prénom (premier mot du nom complet) pour le message de bienvenue
            welcomeName: user?.name?.split(" ")[0] || "Client",

            // Données du prochain rendez-vous, ou null s'il n'y en a aucun
            nextRendezVous: nextRendezVous ? {
                date: nextRendezVous.date.toLocaleDateString("fr-FR", { day: 'numeric', month: 'long' }),
                time: nextRendezVous.time,
                service: nextRendezVous.service
            } : null,

            // Statistiques affichées sur les cartes du tableau de bord
            stats: {
                // Nombre de réservations actuellement confirmées
                activeReservations: await prisma.reservation.count({ where: { clientEmail: user?.email, status: "CONFIRMED" } }),
                // Nombre total de messages reçus par l'utilisateur
                messagesCount: await prisma.message.count({ where: { receiverId: userId } }),
                // Nombre de notifications non encore lues
                notificationsCount: await prisma.notification.count({ where: { userId: userId, isRead: false } })
            }
        };
    } catch (error) {
        console.error("ErreurgetUserDashboardData:", error);
        // Retourne null pour indiquer un échec au composant appelant
        return null;
    }
};
