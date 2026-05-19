import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";

/**
 * Récupère tous les rendez-vous d'un utilisateur identifié par son email.
 * Les résultats sont triés du plus récent au plus ancien.
 * Le statut Prisma (PENDING / CONFIRMED / CANCELLED) est converti en libellé français.
 *
 * @param email - L'adresse email du client dont on veut récupérer les rendez-vous.
 * @returns Un tableau d'objets rendez-vous formatés, ou un tableau vide en cas d'erreur.
 */
export const getUserRendezVous = async (email: string) => {
    try {
        // Recherche toutes les réservations liées à cet email, triées par date décroissante
        const reservations = await prisma.reservation.findMany({
            where: { clientEmail: email },
            orderBy: { date: 'desc' }
        });

        // Transformation des données brutes en objets lisibles pour le frontend
        return reservations.map(r => ({
            id: r.id,
            service: r.service,
            // Date affichée au format français (ex: "15/04/2026")
            date: r.date.toLocaleDateString("fr-FR"),
            // Date au format ISO pour les traitements côté frontend (tri, comparaison)
            dateISO: r.date.toISOString(),
            heure: r.time,
            lieu: r.location,
            // Conversion de l'énumération Prisma en libellé français lisible
            status: r.status === ReservationStatus.PENDING ? "En attente" : r.status === ReservationStatus.CONFIRMED ? "Confirmé" : "Annulé"
        }));
    } catch (error) {
        console.error("Erreur getUserRendezVous:", error);
        // En cas d'erreur, on retourne un tableau vide pour ne pas bloquer l'interface
        return [];
    }
};

/**
 * Crée un nouveau rendez-vous (réservation) pour un client.
 * Le statut est initialisé à PENDING (en attente de confirmation par l'admin).
 *
 * @param data - Les informations du rendez-vous : nom, email, service, date, heure, lieu et message optionnel.
 * @returns Un objet { success: true, reservation } en cas de succès, ou { success: false, error } en cas d'échec.
 */
export const createRendezVous = async (data: {
    clientName: string;
    clientEmail: string;
    service: string;
    date: Date;
    time: string;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    message?: string;
}) => {
    try {
        const reservation = await prisma.reservation.create({
            data: {
                clientName: data.clientName,
                clientEmail: data.clientEmail,
                service: data.service,
                date: data.date,
                time: data.time,
                location: data.location,
                latitude: data.latitude ?? null,
                longitude: data.longitude ?? null,
                message: data.message,
                status: ReservationStatus.PENDING
            }
        });
        return { success: true, reservation };
    } catch (error) {
        console.error("Erreur createRendezVous:", error);
        return { success: false, error: "Impossible de créer le rendez-vous." };
    }
};
