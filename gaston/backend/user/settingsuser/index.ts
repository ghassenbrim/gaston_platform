import { prisma } from "@/lib/prisma";

/**
 * Récupère le profil d'un utilisateur.
 */
export const getUserProfile = async (userId: string) => {
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du profil utilisateur:", error);
        return null;
    }
};

/**
 * Met à jour le profil d'un utilisateur.
 */
export const updateUserProfile = async (userId: string, data: { name: string, email: string }) => {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email
            }
        });
        return { success: true, user };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil utilisateur:", error);
        return { success: false, error: "Impossible de mettre à jour le profil." };
    }
};
