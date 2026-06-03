import { getCurrentUser } from "@/lib/auth";

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
    const user = await getCurrentUser();
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
