import { prisma } from "@/lib/prisma";

/**
 * Récupère l'historique des paiements pour un employé.
 */
export const getEmployeePayments = async (userId: string) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: { Payments: true }
        });

        if (!employee) return { totalPaid: "0€", history: [] };

        const totalPaid = employee.Payments.reduce((acc, curr) => acc + curr.amount, 0);

        return {
            totalPaid: `${totalPaid.toLocaleString("fr-FR")}€`,
            history: employee.Payments.map((pay: any) => ({
                date: pay.date.toLocaleDateString("fr-FR", {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                amount: `${pay.amount.toLocaleString("fr-FR")}€`,
                status: pay.status === "COMPLETED" ? "Payé" : "En attente",
                ref: pay.reference || "N/A"
            })),
            iban: employee.iban || "Non configuré"
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des paiements employé:", error);
        return { iban: "Erreur", history: [] };
    }
};

/**
 * Met à jour l'IBAN de l'employé.
 */
export const updateEmployeeIban = async (userId: string, iban: string) => {
    try {
        await prisma.employee.update({
            where: { userId },
            data: { iban }
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'IBAN:", error);
        return { success: false, error: "Impossible de mettre à jour l'IBAN." };
    }
};
