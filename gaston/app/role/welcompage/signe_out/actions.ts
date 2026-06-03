// Directive Next.js : ce fichier s'exécute uniquement côté serveur (Server Actions)
"use server";

import { clearSessionCookies } from "@/lib/auth";
// Importation de la fonction de redirection de Next.js
import { redirect } from "next/navigation";

/**
 * Action serveur : déconnecte l'utilisateur actuellement connecté.
 * Supprime les cookies de session (userId et userRole),
 * puis redirige vers la page d'accueil / de connexion.
 */
export async function logoutAction() {
    await clearSessionCookies();

    // Redirection vers la page d'accueil (page de connexion)
    // après la suppression des cookies de session
    redirect("/role/welcompage");
}
