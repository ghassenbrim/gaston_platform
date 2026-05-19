import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";
import { createNotification } from "@/backend/user/notification";

/**
 * Supprime automatiquement les réservations PENDING dont la date est dépassée
 * et envoie une notification au client.
 */
export const cleanupExpiredReservations = async () => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const expired = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.PENDING,
                date: { lt: today },
            },
            select: { id: true, clientEmail: true, service: true, date: true, time: true },
        });

        if (expired.length === 0) return;

        for (const reservation of expired) {
            const clientUser = await prisma.user.findUnique({
                where: { email: reservation.clientEmail },
                select: { id: true },
            });

            if (clientUser) {
                const dateStr = reservation.date.toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                });
                await createNotification(
                    clientUser.id,
                    "reservation_cancelled",
                    `Votre demande de réservation "${reservation.service}" du ${dateStr} à ${reservation.time} a été annulée automatiquement car elle n'a pas été confirmée à temps.`,
                    reservation.id
                );
            }

            await prisma.reservation.delete({ where: { id: reservation.id } });
        }

        console.log(`🗑️ ${expired.length} réservation(s) expirée(s) supprimée(s) automatiquement.`);
    } catch (error) {
        console.error("Erreur lors du nettoyage des réservations expirées:", error);
    }
};

/**
 * Récupère toutes les réservations avec les employés assignés.
 */
export const getReservations = async (status?: string) => {
    try {
        // Nettoyage automatique avant chaque chargement
        await cleanupExpiredReservations();

        const where = status && status !== "Toutes" 
            ? { status: status === "En attente" ? ReservationStatus.PENDING : status === "Confirmée" ? ReservationStatus.CONFIRMED : ReservationStatus.CANCELLED }
            : {};

        const reservations = await prisma.reservation.findMany({
            where,
            include: { Employees: true },
            orderBy: { date: 'desc' }
        });

        return reservations.map(r => ({
            id: r.id,
            client: r.clientName,
            email: r.clientEmail,
            service: r.service,
            date: new Date(r.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }),
            dateISO: r.date.toISOString(),
            heure: r.time,
            lieu: r.location,
            latitude: r.latitude,
            longitude: r.longitude,
            status: r.status === ReservationStatus.PENDING ? "En attente" : r.status === ReservationStatus.CONFIRMED ? "Confirmée" : "Annulée",
            message: r.message || "",
            team: r.Employees.map((e) => `${e.firstName} ${e.lastName}`),
            teamIds: r.Employees.map((e) => e.id),
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des réservations:", error);
        return [];
    }
};

/**
 * Met à jour le statut d'une réservation et optionnellement l'équipe assignée.
 */
export const updateReservationStatus = async (id: string, status: string, employeeIds?: string[], contractUrl?: string) => {
    try {
        const prismaStatus = status === "En attente" ? ReservationStatus.PENDING : status === "Confirmée" ? ReservationStatus.CONFIRMED : ReservationStatus.CANCELLED;

        const data: {
            status: ReservationStatus;
            Employees?: { set: { id: string }[] };
        } = { status: prismaStatus };
        if (employeeIds) {
            data.Employees = {
                set: employeeIds.map(id => ({ id }))
            };
        }

        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data,
            include: { Employees: true }
        });

        // Notifications employés si confirmé
        if (prismaStatus === ReservationStatus.CONFIRMED && employeeIds && employeeIds.length > 0) {
            const assignedEmployees = await prisma.employee.findMany({
                where: { id: { in: employeeIds } },
                select: { userId: true }
            });
            if (assignedEmployees.length > 0) {
                await prisma.notification.createMany({
                    data: assignedEmployees.map((employee) => ({
                        userId: employee.userId,
                        type: "system",
                        content: `Nouvelle mission: réservation "${updatedReservation.service}" le ${updatedReservation.date.toLocaleDateString("fr-FR")} à ${updatedReservation.time}.`,
                    }))
                });
            }
        }

        // Notification + contrat client
        if (prismaStatus === ReservationStatus.CONFIRMED || prismaStatus === ReservationStatus.CANCELLED) {
            const clientUser = await prisma.user.findUnique({
                where: { email: updatedReservation.clientEmail },
                select: { id: true },
            });
            if (clientUser) {
                const dateStr = updatedReservation.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
                const notifType = prismaStatus === ReservationStatus.CONFIRMED ? "reservation_confirmed" : "reservation_cancelled";
                const label = prismaStatus === ReservationStatus.CONFIRMED ? "confirmé ✅" : "annulé ❌";
                await createNotification(
                    clientUser.id,
                    notifType,
                    `Votre rendez-vous "${updatedReservation.service}" du ${dateStr} à ${updatedReservation.time} a été ${label}.`,
                    updatedReservation.id
                );

                // Créer le contrat si un fichier a été uploadé
                if (prismaStatus === ReservationStatus.CONFIRMED && contractUrl) {
                    await prisma.contract.create({
                        data: {
                            userId: clientUser.id,
                            url: contractUrl,
                            status: "ACTIVE",
                        },
                    });
                    await createNotification(
                        clientUser.id,
                        "contract",
                        `Un contrat a été ajouté pour votre réservation "${updatedReservation.service}". Consultez-le dans votre espace Contrats.`,
                        updatedReservation.id
                    );
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la réservation:", error);
        return { success: false, error: "Impossible de mettre à jour la réservation." };
    }
};

/**
 * Supprime une réservation.
 */
export const deleteReservation = async (id: string) => {
    try {
        await prisma.reservation.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de la réservation:", error);
        return { success: false, error: "Impossible de supprimer la réservation." };
    }
};
