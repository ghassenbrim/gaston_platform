import { prisma } from "@/lib/prisma";

/**
 * Récupère les données du tableau de bord pour un employé spécifique.
 */
export const getEmployeeDashboardData = async (userId: string) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
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

        if (!employee) return null;

        const emp = employee as any;
        const totalHours = emp.WorkDays.reduce((acc: number, curr: any) => acc + curr.hours, 0);
        const pendingPayments = emp.Payments.filter((p: any) => p.status === "PENDING").length;
        const nextService = emp.WorkDays[0]?.date.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' }) || "N/A";

        return {
            employeeName: `${emp.firstName}`,
            stats: {
                workDaysThisMonth: emp.WorkDays.length.toString(),
                totalHours: `${totalHours}h`,
                nextService: nextService,
                estimatedPayment: emp.Payments.find((p: any) => p.status === "PENDING")?.amount.toLocaleString("fr-FR") + "€" || "0€"
            },
            recentWorkDays: emp.WorkDays.slice(0, 3).map((wd: any) => ({
                date: wd.date.toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' }),
                description: wd.description || "Travail",
                timeRange: "09:00 - 18:00",
                status: wd.status === "PAID" ? "Confirmé" : wd.status === "APPROVED" ? "À préparer" : "En attente",
                hours: wd.hours
            }))
        };
    } catch (error) {
        console.error("Erreur lors de la récupération du dashboard employé:", error);
        return null;
    }
};
