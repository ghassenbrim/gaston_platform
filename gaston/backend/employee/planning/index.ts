import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";

/**
 * Récupère le planning (missions et réservations assignées) pour un employé.
 */
export const getEmployeePlanning = async (userId: string) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: { 
                Missions: {
                    where: {
                        date: { gte: today }
                    },
                    orderBy: { date: "asc" }
                },
                Reservations: {
                    where: {
                        date: { gte: today },
                        status: ReservationStatus.CONFIRMED
                    },
                    include: { Employees: true },
                    orderBy: { date: "asc" }
                },
                WorkDays: {
                    take: 10,
                    orderBy: { date: 'desc' }
                },
                Payments: {
                    take: 10,
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!employee) throw new Error("Employé non trouvé");

        // On combine les missions et réservations en un seul flux chronologique
        const timeline = [
            ...employee.Missions.map((m) => ({
                id: m.id,
                type: "mission",
                title: m.title,
                date: m.date,
                time: m.time,
                location: m.location,
                color: m.color || "blue"
            })),
            ...employee.Reservations.map((r) => ({
                id: r.id,
                type: "reservation",
                title: `${r.service} - ${r.clientName}`,
                team: r.Employees?.map((e) => `${e.firstName} ${e.lastName}`) || [],
                date: r.date,
                time: r.time,
                location: r.location,
                color: "green"
            }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        return timeline;
    } catch (error) {
        console.error("Erreurlors de la récupération du planning employé:", error);
        return [];
    }
};
