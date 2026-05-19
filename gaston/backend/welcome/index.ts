import { prisma } from "@/lib/prisma";

/**
 * Récupère les données pour la page d'accueil (Portfolio, etc.).
 */
export const getWelcomeData = async () => {
    try {
        const photos = await prisma.photo.findMany({
            orderBy: { createdAt: 'desc' },
            take: 12 // On prend les 12 dernières photos
        });

        // On peut structurer les données pour le frontend
        return {
            portfolio: photos.map(p => ({
                id: p.id,
                url: p.url,
                category: p.category || "General"
            })),
            // On peut ajouter d'autres données comme des témoignages ou services dynamiques ici
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des données welcome:", error);
        return { portfolio: [] };
    }
};
