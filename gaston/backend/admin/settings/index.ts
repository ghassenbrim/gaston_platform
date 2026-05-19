import { prisma } from "@/lib/prisma";

/**
 * Récupère le profil complet de l'administrateur connecté.
 */
export const getAdminProfile = async (userId: string) => {
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                phone: true,
                age: true,
                gender: true,
                avatar: true,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du profil admin:", error);
        return null;
    }
};

/**
 * Met à jour les informations du profil (téléphone, âge, genre).
 */
export const updateAdminProfile = async (
    userId: string,
    data: { phone?: string; age?: number | null; gender?: string }
) => {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                phone: data.phone ?? undefined,
                age: data.age ?? undefined,
                gender: data.gender ?? undefined,
            },
        });
        return { success: true, user };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil admin:", error);
        return { success: false, error: "Impossible de mettre à jour le profil." };
    }
};

/**
 * Met à jour le mot de passe après vérification de l'ancien.
 */
export const updateAdminPassword = async (
    userId: string,
    data: { currentPassword: string; newPassword: string }
) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user || user.password !== data.currentPassword) {
            return { success: false, error: "Mot de passe actuel incorrect." };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { password: data.newPassword },
        });

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        return { success: false, error: "Impossible de modifier le mot de passe." };
    }
};
