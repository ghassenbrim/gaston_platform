import { prisma } from "@/lib/prisma";

/**
 * Récupère toutes les missions (évènements planning).
 * Peut être filtré par nom d'employé.
 */
export const getMissions = async (filterEmployee?: string) => {
    try {
        const where: any = {};
        if (filterEmployee && filterEmployee !== "Tous") {
            where.OR = [
                { Employee: { firstName: { contains: filterEmployee, mode: 'insensitive' as const } } },
                { Employee: { lastName: { contains: filterEmployee, mode: 'insensitive' as const } } }
            ];
        }

        const missions = await prisma.mission.findMany({
            where,
            include: { Employee: true },
            orderBy: { date: "asc" }
        });

        return missions.map(m => ({
            id: m.id,
            employee: m.Employee ? `${m.Employee.firstName} ${m.Employee.lastName}` : "Non assigné",
            title: m.title,
            date: new Date(m.date).toLocaleDateString("fr-FR", {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            }),
            time: m.time,
            lieu: m.location,
            color: m.color || "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20"
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des missions:", error);
        return [];
    }
};

/**
 * Crée une nouvelle mission dans le planning.
 */
export const createMission = async (data: {
    employeeId?: string;
    title: string;
    date: Date;
    time: string;
    location: string;
    color?: string;
}) => {
    try {
        const mission = await prisma.mission.create({
            data: {
                employeeId: data.employeeId,
                title: data.title,
                date: data.date,
                time: data.time,
                location: data.location,
                color: data.color,
            }
        });

        return { success: true, mission };
    } catch (error) {
        console.error("Erreur lors de la création de la mission:", error);
        return { success: false, error: "Impossible de créer la mission." };
    }
};

/**
 * Supprime une mission.
 */
export const deleteMission = async (id: string) => {
    try {
        await prisma.mission.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de la mission:", error);
        return { success: false, error: "Impossible de supprimer la mission." };
    }
};
