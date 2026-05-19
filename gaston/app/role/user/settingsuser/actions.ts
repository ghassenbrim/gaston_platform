"use server";

// Actions serveur (Server Actions Next.js) pour la gestion du profil utilisateur.
// Ces fonctions s'exécutent exclusivement côté serveur et sont appelées
// depuis les composants client pour interagir avec la base de données.

import { getUserProfile, updateUserProfile, updateUserPassword } from "@/backend/user/settings";
import { cookies } from "next/headers";

/**
 * Récupère le profil complet de l'utilisateur actuellement connecté.
 * Lit l'ID utilisateur depuis le cookie de session.
 * Retourne une erreur si l'utilisateur n'est pas authentifié.
 */
export async function fetchUserProfileAction() {
    // Lecture de l'ID utilisateur stocké dans le cookie de session
    const userId = (await cookies()).get("userId")?.value;
    if (!userId) return { success: false, error: "Non authentifié. Veuillez vous connecter." };
    return await getUserProfile(userId);
}

/**
 * Met à jour les informations personnelles de l'utilisateur connecté.
 * Reçoit les données via un FormData (formulaire HTML).
 * Retourne une erreur si l'utilisateur n'est pas authentifié.
 */
export async function updateUserProfileAction(formData: FormData) {
    // Vérification de l'authentification via le cookie de session
    const userId = (await cookies()).get("userId")?.value;
    if (!userId) return { success: false, error: "Non authentifié. Veuillez vous connecter." };

    // Extraction des champs du formulaire
    const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        age: formData.get("age") as string,
        gender: formData.get("gender") as string,
    };

    return await updateUserProfile(userId, data);
}

/**
 * Modifie le mot de passe de l'utilisateur connecté.
 * Nécessite le mot de passe actuel pour validation et le nouveau mot de passe.
 * Retourne une erreur si l'utilisateur n'est pas authentifié.
 */
export async function updateUserPasswordAction(data: { currentPassword: string; newPassword: string }) {
    // Vérification de l'authentification via le cookie de session
    const userId = (await cookies()).get("userId")?.value;
    if (!userId) return { success: false, error: "Non authentifié. Veuillez vous connecter." };
    return await updateUserPassword(userId, data);
}
