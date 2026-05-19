import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Récupère la liste complète de tous les utilisateurs ayant le rôle USER (clients).
 * Les administrateurs et employés sont exclus du résultat.
 * Les résultats sont triés du plus récent inscrit au plus ancien.
 *
 * @returns Un tableau d'objets utilisateurs formatés pour l'affichage, ou un tableau vide en cas d'erreur.
 */
export const getAllUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            where: { role: Role.USER }, // Filtre uniquement les clients (pas les admins ni employés)
            orderBy: { createdAt: 'desc' }
        });

        // Transformation des données brutes en objets allégés pour le frontend
        return users.map(u => ({
            id: u.id,
            name: u.name || null,          // Le nom peut être null si non renseigné
            email: u.email,
            phone: u.phone || null,        // Le téléphone est optionnel
            age: u.age || null,            // L'âge est optionnel
            gender: u.gender || null,      // Le genre est optionnel
            // Formatage de la date d'inscription au format français (ex: "15/04/2026")
            dateInscription: u.createdAt.toLocaleDateString("fr-FR"),
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        return [];
    }
};

/**
 * Supprime un utilisateur et toutes ses données liées de manière atomique.
 * Utilise une transaction Prisma pour garantir qu'aucune donnée orpheline ne reste en base.
 * Supprime dans l'ordre : notifications, favoris, photos, messages (envoyés et reçus), contrats, puis le compte.
 *
 * @param id - L'identifiant de l'utilisateur à supprimer.
 * @returns { success: true } en cas de succès, ou { success: false, error } en cas d'échec.
 */
export const deleteUser = async (id: string) => {
    try {
        // Transaction en tableau : toutes les suppressions s'exécutent en même temps de façon atomique
        await prisma.$transaction([
            prisma.notification.deleteMany({ where: { userId: id } }),                                    // Notifications de l'utilisateur
            prisma.favorite.deleteMany({ where: { userId: id } }),                                        // Favoris enregistrés
            prisma.photo.deleteMany({ where: { userId: id } }),                                           // Photos de la galerie
            prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),         // Messages envoyés ET reçus
            prisma.contract.deleteMany({ where: { userId: id } }),                                        // Contrats liés
            prisma.user.delete({ where: { id } }),                                                        // Suppression du compte lui-même
        ]);
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        return { success: false, error: "Impossible de supprimer l'utilisateur." };
    }
};
