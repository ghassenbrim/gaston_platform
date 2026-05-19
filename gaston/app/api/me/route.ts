// Importation de l'utilitaire Next.js pour lire les cookies HTTP
import { cookies } from "next/headers";
// Importation du client Prisma pour accéder à la base de données
import { prisma } from "@/lib/prisma";

/**
 * Route API : GET /api/me
 *
 * Retourne les informations de l'utilisateur actuellement connecté
 * en se basant sur les cookies de session (userId et userRole).
 * Utilisée par le client pour vérifier l'état de la session
 * et récupérer le profil de l'utilisateur sans recharger la page.
 *
 * Réponse si non connecté : { loggedIn: false }
 * Réponse si connecté     : { loggedIn: true, id, name, email, role, dashboard }
 */
export async function GET() {
    // Lecture des cookies de session depuis la requête HTTP
    const cookieStore = await cookies();
    const userId   = cookieStore.get("userId")?.value;
    const userRole = cookieStore.get("userRole")?.value;

    // Si l'un des cookies de session est absent, l'utilisateur n'est pas connecté
    if (!userId || !userRole) {
        return Response.json({ loggedIn: false });
    }

    // Récupération des informations de l'utilisateur en base de données
    // (ne charge que les champs nécessaires pour limiter les données exposées)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
    });

    // Si l'utilisateur a été supprimé de la base alors que son cookie existe encore
    if (!user) {
        return Response.json({ loggedIn: false });
    }

    /**
     * Table de correspondance entre les rôles et les URLs des tableaux de bord.
     * Permet au client de savoir vers quelle page rediriger l'utilisateur.
     */
    const dashboardMap: Record<string, string> = {
        ADMIN:    "/role/admin/dashboard",
        EMPLOYEE: "/role/employeer/dashboard",
        USER:     "/role/user/dashboard",
    };

    // Retourner le profil complet de l'utilisateur avec l'URL de son tableau de bord
    return Response.json({
        loggedIn:  true,
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        // Fallback sur le dashboard USER si le rôle n'est pas reconnu dans la table
        dashboard: dashboardMap[user.role] || "/role/user/dashboard",
    });
}
