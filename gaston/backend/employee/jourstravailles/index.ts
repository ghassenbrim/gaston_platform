import { prisma } from "@/lib/prisma";
import { WorkStatus } from "@prisma/client";

/**
 * Récupère toutes les journées travaillées d'un employé.
 */
export const getEmployeeWorkDays = async (userId: string) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
                WorkDays: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!employee) return [];

        return (employee as any).WorkDays.map((wd: any) => ({
            id: wd.id,
            date: wd.date.toLocaleDateString("fr-FR", {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            }),
            hours: wd.hours,
            description: wd.description,
            status: wd.status
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des journées de travail:", error);
        return [];
    }
};

/**
 * Permet à un employé de déclarer une journée de travail.
 */
export const declareWorkDay = async (userId: string, data: {
    date: Date;
    hours: number;
    description: string;
}) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId }
        });

        if (!employee) throw new Error("Employé non trouvé");

        const workDay = await prisma.workDay.create({
            data: {
                employeeId: employee.id,
                date: data.date,
                hours: data.hours,
                description: data.description,
                status: WorkStatus.PENDING
            }
        });

        return { success: true, workDay };
    } catch (error) {
        console.error("Erreur lors de la déclaration de la journée:", error);
        return { success: false, error: "Impossible de déclarer la journée." };
    }
};
