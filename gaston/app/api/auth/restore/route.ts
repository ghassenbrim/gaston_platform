// Importation de l'utilitaire Next.js pour manipuler les cookies HTTP
import { cookies } from "next/headers";
// Importation du client Prisma pour accéder à la base de données
import { prisma } from "@/lib/prisma";

/**
 * Route API : POST /api/auth/restore
 *
 * Restaure la session d'un utilisateur à partir d'un userId stocké côté client
 * (typiquement dans le sessionStorage du navigateur).
 * Utilisée lorsqu'un onglet est rouvert et que les cookies de session ont expiré
 * mais que l'identifiant est encore disponible côté client.
 *
 * Flux :
 *  1. Reçoit un userId dans le corps de la requête JSON
 *  2. Vérifie que l'utilisateur existe en base de données
 *  3. Repose les cookies de session (userId + userRole) pour 7 jours
 *  4. Retourne le rôle normalisé pour que le client puisse rediriger
 */
export async function POST(request: Request) {
    try {
        // Lecture et désérialisation du corps JSON de la requête
        const { userId } = await request.json();

        // Si aucun userId n'est fourni, on ne peut pas restaurer la session
        if (!userId) {
            console.warn("[auth/restore] Pas d'userId fourni");
            return Response.json({ success: false });
        }

        // Recherche de l'utilisateur en base, en ne sélectionnant que les champs nécessaires
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true }, // On n'a besoin que de l'id et du rôle
        });

        // Si l'utilisateur n'existe plus en base, la restauration est impossible
        if (!user) {
            console.warn(`[auth/restore] Utilisateur non trouvé: ${userId}`);
            return Response.json({ success: false });
        }

        // Normalisation du rôle en majuscules pour garantir la cohérence
        const roleValue = String(user.role).toUpperCase();
        console.log(`[auth/restore] Session restaurée pour ${userId} avec role: ${roleValue}`);

        // Re-création des cookies de session sécurisés pour 7 jours
        const cookieStore = await cookies();
        cookieStore.set("userId",   user.id,    { path: "/", maxAge: 86400 * 7, httpOnly: true, secure: true, sameSite: "lax" });
        cookieStore.set("userRole", roleValue,  { path: "/", maxAge: 86400 * 7, httpOnly: true, secure: true, sameSite: "lax" });

        // Retourner le succès avec le rôle pour que le client puisse rediriger vers le bon dashboard
        return Response.json({ success: true, role: roleValue });
    } catch (error) {
        console.error("[auth/restore] Erreur:", error);
        return Response.json({ success: false });
    }
}
