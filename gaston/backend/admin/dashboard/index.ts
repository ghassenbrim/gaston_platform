import { prisma } from "@/lib/prisma";

/**
 * Récupère les statistiques globales affichées sur le tableau de bord administrateur :
 *  - Nombre d'employés actifs
 *  - Total des heures travaillées (toutes périodes confondues)
 *  - Nombre de paiements en attente
 *  - Nombre de réservations confirmées
 *
 * @returns Un objet avec les 4 indicateurs clés sous forme de chaînes de caractères,
 *          ou des valeurs à "0" en cas d'erreur.
 */
export const getDashboardStats = async () => {
    try {
        // Comptage du nombre total d'employés enregistrés
        const activeEmployeesCount = await prisma.employee.count();

        // Agrégation de la somme totale des heures de toutes les journées de travail
        const totalWorkHours = await prisma.workDay.aggregate({
            _sum: { hours: true }
        });

        // Comptage des paiements dont le statut est encore "PENDING" (en attente)
        const pendingPaymentsCount = await prisma.payment.count({
            where: { status: "PENDING" }
        });

        // Comptage des réservations confirmées (utilisé comme indicateur "jours enregistrés")
        const registeredDaysCount = await prisma.reservation.count({
            where: { status: "CONFIRMED" }
        });

        return {
            activeEmployees: activeEmployeesCount.toString(),
            // Si aucune heure n'est enregistrée, on affiche "0h"
            totalHours: `${totalWorkHours._sum.hours || 0}h`,
            pendingPayments: pendingPaymentsCount.toString(),
            registeredDays: registeredDaysCount.toString(),
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques du dashboard:", error);
        // Retourne des valeurs neutres pour éviter un plantage de l'interface
        return {
            activeEmployees: "0",
            totalHours: "0h",
            pendingPayments: "0",
            registeredDays: "0",
        };
    }
};

/**
 * Représente le type d'une entrée d'activité récente.
 * Utilisé pour typer les résultats des différentes requêtes avant fusion.
 */
type ActivityType = "workday" | "reservation" | "user" | "employee" | "payment";

/**
 * Structure interne d'une activité récente avant formatage pour le frontend.
 */
interface RawActivity {
    type: ActivityType;
    title: string;       // Titre principal (ex: nom du client ou de l'employé)
    subtitle: string;    // Description courte (ex: "Réservation — Portrait")
    date: Date;          // Date brute pour le tri
    status: string | null; // Statut traduit en français, ou null si non applicable
}

/**
 * Récupère les 2 activités les plus récentes sur l'ensemble des espaces admin
 * (journées de travail, réservations, nouveaux utilisateurs, nouveaux employés, paiements).
 * Les résultats sont fusionnés, triés par date décroissante, puis tronqués aux 2 premiers.
 *
 * @returns Un tableau de 2 activités récentes formatées pour l'affichage, ou un tableau vide en cas d'erreur.
 */
export const getRecentActivity = async () => {
    try {
        // Récupération en parallèle des 5 derniers éléments de chaque catégorie
        const [workDays, reservations, newUsers, newEmployees, payments] = await Promise.all([
            prisma.workDay.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                include: { Employee: true }, // Nécessaire pour afficher le nom de l'employé
            }),
            prisma.reservation.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
            }),
            prisma.user.findMany({
                take: 5,
                where: { role: "USER" }, // Uniquement les clients (pas les admins ni employés)
                orderBy: { createdAt: "desc" },
            }),
            prisma.employee.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
            }),
            prisma.payment.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                include: { Employee: true }, // Nécessaire pour afficher le nom de l'employé
            }),
        ]);

        // Normalisation de chaque catégorie vers le format RawActivity commun
        const items: RawActivity[] = [
            // Journées travaillées
            ...workDays.map(w => ({
                type: "workday" as ActivityType,
                title: `${w.Employee.firstName} ${w.Employee.lastName}`,
                subtitle: `Journée travaillée — ${w.hours}h`,
                date: w.updatedAt,
                status: w.status === "PAID" ? "Payé" : w.status === "APPROVED" ? "Approuvé" : "En attente",
            })),
            // Réservations clients
            ...reservations.map(r => ({
                type: "reservation" as ActivityType,
                title: r.clientName,
                subtitle: `Réservation — ${r.service}`,
                date: r.updatedAt,
                status: r.status === "CONFIRMED" ? "Confirmée" : r.status === "CANCELLED" ? "Annulée" : "En attente",
            })),
            // Nouveaux utilisateurs inscrits
            ...newUsers.map(u => ({
                type: "user" as ActivityType,
                title: u.name || u.email, // On affiche l'email si le nom n'est pas encore renseigné
                subtitle: "Nouvel utilisateur inscrit",
                date: u.createdAt,
                status: null, // Pas de statut applicable pour un utilisateur
            })),
            // Nouveaux employés ajoutés
            ...newEmployees.map(e => ({
                type: "employee" as ActivityType,
                title: `${e.firstName} ${e.lastName}`,
                subtitle: `Employé ajouté${e.position ? ` — ${e.position}` : ""}`,
                date: e.createdAt,
                status: null, // Pas de statut applicable pour un employé nouvellement créé
            })),
            // Paiements enregistrés
            ...payments.map(p => ({
                type: "payment" as ActivityType,
                title: `${p.Employee.firstName} ${p.Employee.lastName}`,
                subtitle: `Paiement — ${p.amount}€`,
                date: p.updatedAt,
                status: p.status === "COMPLETED" ? "Complété" : p.status === "CANCELLED" ? "Annulé" : "En attente",
            })),
        ];

        // Tri par date décroissante et conservation des 2 activités les plus récentes
        items.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Formatage final de la date pour l'affichage (ex: "mer. 16 avr. 14:30")
        return items.slice(0, 2).map(item => ({
            type: item.type,
            title: item.title,
            subtitle: item.subtitle,
            date: new Date(item.date).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }),
            status: item.status,
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des activités récentes:", error);
        return [];
    }
};
