import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Récupère le profil complet d'un utilisateur depuis la base de données.
 * Seuls les champs nécessaires à l'affichage sont sélectionnés (pas le mot de passe).
 *
 * @param userId - L'identifiant de l'utilisateur.
 * @returns { success: true, user } avec les données du profil, ou { success: false, error } si introuvable ou en cas d'erreur.
 */
export const getUserProfile = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                age: true,
                gender: true,
                role: true,
                avatar: true,
                createdAt: true,
            }
        });

        // Si l'utilisateur n'existe pas en base, on retourne une erreur explicite
        if (!user) return { success: false, error: "Utilisateur non trouvé" };

        return { success: true, user };
    } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        return { success: false, error: "Erreur serveur" };
    }
};

/**
 * Met à jour le mot de passe d'un utilisateur après vérification de l'ancien mot de passe.
 * @param userId - L'identifiant de l'utilisateur.
 * @param data   - Objet contenant l'ancien mot de passe (currentPassword) et le nouveau (newPassword).
 * @returns { success: true } si la mise à jour réussit, ou { success: false, error } sinon.
 */
export const updateUserPassword = async (
    userId: string,
    data: { currentPassword: string; newPassword: string }
) => {
    try {
        // Récupération du mot de passe actuel stocké en base
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        // Vérification que l'utilisateur existe et que l'ancien mot de passe correspond
        if (!user || !(await verifyPassword(data.currentPassword, user.password))) {
            return { success: false, error: "Mot de passe actuel incorrect." };
        }

        // Mise à jour avec le nouveau mot de passe hache
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

/**
 * Met à jour les informations de profil d'un utilisateur (nom, email, téléphone, âge, genre).
 * L'âge est converti en entier si fourni en tant que chaîne de caractères.
 *
 * @param userId - L'identifiant de l'utilisateur à mettre à jour.
 * @param data   - Les nouvelles valeurs du profil (type any car le formulaire peut envoyer des chaînes).
 * @returns { success: true, user } avec les données mises à jour, ou { success: false, error } en cas d'échec.
 */
export const updateUserProfile = async (userId: string, data: any) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                // L'âge peut être envoyé comme chaîne depuis le formulaire ; on le convertit en nombre entier
                age: data.age ? parseInt(data.age) : undefined,
                gender: data.gender,
            }
        });

        return { success: true, user: updatedUser };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
        return { success: false, error: "Impossible de mettre à jour le profil." };
    }
};
