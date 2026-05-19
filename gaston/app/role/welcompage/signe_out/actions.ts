// Directive Next.js : ce fichier s'exécute uniquement côté serveur (Server Actions)
"use server";

// Importation de l'utilitaire Next.js pour manipuler les cookies HTTP
import { cookies } from "next/headers";
// Importation de la fonction de redirection de Next.js
import { redirect } from "next/navigation";

/**
 * Action serveur : déconnecte l'utilisateur actuellement connecté.
 * Supprime les cookies de session (userId et userRole),
 * puis redirige vers la page d'accueil / de connexion.
 */
export async function logoutAction() {
    // Accès au store de cookies HTTP côté serveur
    const cookieStore = await cookies();

    // Suppression du cookie contenant l'identifiant de l'utilisateur
    cookieStore.delete("userId");
    // Suppression du cookie contenant le rôle de l'utilisateur
    cookieStore.delete("userRole");

    // Redirection vers la page d'accueil (page de connexion)
    // après la suppression des cookies de session
    redirect("/role/welcompage");
}
