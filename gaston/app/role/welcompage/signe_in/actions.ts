// Directive Next.js : ce fichier s'exécute uniquement côté serveur (Server Actions)
"use server";

// Importation de la fonction de connexion depuis le backend d'authentification
import { signIn } from "@/backend/auth";
import { setSessionCookies } from "@/lib/auth";

/**
 * Table de correspondance entre les rôles utilisateurs et leurs URLs de tableau de bord.
 * Permet de rediriger chaque rôle vers la bonne interface après la connexion.
 */
const dashboardMap: Record<string, string> = {
    ADMIN:    "/role/admin/dashboard",
    EMPLOYEE: "/role/employeer/dashboard",
    USER:     "/role/user/dashboard",
};

/**
 * Action serveur déclenchée à la soumission du formulaire de connexion.
 * Valide les champs, appelle signIn, puis pose les cookies de session
 * et retourne l'URL du tableau de bord correspondant au rôle de l'utilisateur.
 *
 * @param formData - Les données du formulaire (email, password)
 * @returns Un objet indiquant le succès ou l'échec, avec les infos de session en cas de succès
 */
export async function loginAction(formData: FormData) {
    // Extraction et typage des champs du formulaire
    const email    = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validation basique : les deux champs sont obligatoires
    if (!email || !password) {
        return { success: false, error: "Email et mot de passe requis." };
    }

    // Appel de la logique d'authentification (vérification email + mot de passe)
    const result = await signIn(email, password);

    if (result.success && result.user) {
        const userRole = result.user.role as string;

        await setSessionCookies({ id: result.user.id, role: userRole });

        // Détermination de l'URL du tableau de bord selon le rôle (fallback sur USER)
        const dashboardUrl = dashboardMap[userRole] || "/role/user/dashboard";

        // Retourner toutes les informations de session nécessaires au client
        return {
            success:   true,
            userId:    result.user.id,
            role:      userRole,
            name:      result.user.name  ?? null,
            email:     result.user.email ?? null,
            dashboard: dashboardUrl, // URL vers laquelle le client doit rediriger
        };
    }

    // En cas d'échec, retourner le message d'erreur provenant du backend
    return { success: false, error: (result as { error?: string }).error ?? "Email ou mot de passe incorrect." };
}
