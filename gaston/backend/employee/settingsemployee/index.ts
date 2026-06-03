import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export const getEmployeeProfile = async (userId: string) => {
    try {
        return await prisma.employee.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                        avatar: true,
                        phone: true,
                        age: true,
                        gender: true,
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du profil employé:", error);
        return null;
    }
};

export const updateEmployeeProfile = async (userId: string, data: {
    firstName?: string;
    lastName?: string;
    position?: string;
    phone?: string;
    age?: number | null;
    gender?: string;
}) => {
    try {
        const employee = await prisma.employee.update({
            where: { userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                position: data.position,
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                phone: data.phone ?? undefined,
                age: data.age ?? undefined,
                gender: data.gender ?? undefined,
            }
        });

        return { success: true, employee };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil employé:", error);
        return { success: false, error: "Impossible de mettre à jour le profil." };
    }
};

export const updateEmployeePassword = async (
    userId: string,
    data: { currentPassword: string; newPassword: string }
) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user || !(await verifyPassword(data.currentPassword, user.password))) {
            return { success: false, error: "Mot de passe actuel incorrect." };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { password: await hashPassword(data.newPassword) },
        });

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        return { success: false, error: "Impossible de modifier le mot de passe." };
    }
};
