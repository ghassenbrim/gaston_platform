"use server";

// Actions serveur (Server Actions Next.js) pour la gestion du profil utilisateur.
// Ces fonctions s'exécutent exclusivement côté serveur et sont appelées
// depuis les composants client pour interagir avec la base de données.

import { getUserProfile, updateUserProfile, updateUserPassword } from "@/backend/user/settings";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * Récupère le profil complet de l'utilisateur actuellement connecté.
 * Lit l'ID utilisateur depuis le cookie de session.
 * Retourne une erreur si l'utilisateur n'est pas authentifié.
 */
export async function fetchUserProfileAction() {
    const user = await requireRole(Role.USER);
    if (!user) return { success: false, error: "Non authentifié. Veuillez vous connecter." };
    return await getUserProfile(user.id);
}

/**
 * Met à jour les informations personnelles de l'utilisateur connecté.
 * Reçoit les données via un FormData (formulaire HTML).
 * Retourne une erreur si l'utilisateur n'est pas authentifié.
 */
export async function updateUserProfileAction(formData: FormData) {
    const user = await requireRole(Role.USER);
    if (!user) return { success: false, error: "Non authentifié. Veuillez vous connecter." };

    // Extraction des champs du formulaire
    const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        age: formData.get("age") as string,
        gender: formData.get("gender") as string,
    };

    return await updateUserProfile(user.id, data);
}

/**
 * Modifie le mot de passe de l'utilisateur connecté.
 * Nécessite le mot de passe actuel pour validation et le nouveau mot de passe.
 * Retourne une erreur si l'utilisateur n'est pas authentifié.
 */
export async function updateUserPasswordAction(data: { currentPassword: string; newPassword: string }) {
    const user = await requireRole(Role.USER);
    if (!user) return { success: false, error: "Non authentifié. Veuillez vous connecter." };
    return await updateUserPassword(user.id, data);
}
