// Directive Next.js : ce fichier s'exécute uniquement côté serveur (Server Actions)
"use server";

// Importation des fonctions d'authentification et de vérification depuis le backend
import { signUp, sendVerificationCode, verifyCode } from "@/backend/auth";
// Importation de l'utilitaire Next.js pour manipuler les cookies HTTP
import { cookies } from "next/headers";
import { setSessionCookies } from "@/lib/auth";

/**
 * Action serveur : envoie un code de vérification par email.
 * Utilisée à la première étape du formulaire d'inscription pour valider l'adresse email.
 *
 * @param email - L'adresse email à vérifier
 * @returns Le résultat de l'envoi (succès ou message d'erreur)
 */
export async function sendVerificationAction(email: string) {
    // Validation : l'email est obligatoire
    if (!email) return { success: false, error: "L'email est requis." };
    const normalizedEmail = email.trim().toLowerCase();
    // Délégation au backend qui génère et envoie le code
    return await sendVerificationCode(normalizedEmail);
}

/**
 * Action serveur : vérifie le code saisi par l'utilisateur.
 * En cas de succès, pose un cookie temporaire "verified_email" valable 15 minutes
 * pour confirmer que l'adresse email a bien été validée avant la création du compte.
 *
 * @param email - L'adresse email concernée
 * @param code  - Le code à 6 chiffres reçu par l'utilisateur
 * @returns Le résultat de la vérification (succès ou message d'erreur)
 */
export async function verifyCodeAction(email: string, code: string) {
    // Validation : les deux paramètres sont obligatoires
    if (!email || !code) return { success: false, error: "L'email et le code sont requis." };
    const normalizedEmail = email.trim().toLowerCase();

    // Vérification du code en base de données
    const result = await verifyCode(normalizedEmail, code);

    if (result.success) {
        // Si le code est valide, on pose un cookie "verified_email" pour mémoriser
        // que cet email a été vérifié (durée de vie : 15 minutes, strict pour la sécurité)
        (await cookies()).set("verified_email", normalizedEmail, {
            path: "/",
            maxAge: 15 * 60,       // 15 minutes (en secondes)
            httpOnly: true,        // Non accessible en JavaScript côté client
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",    // Protection contre les requêtes cross-site
        });
    }
    return result;
}

/**
 * Action serveur : crée le compte utilisateur après vérification de l'email.
 * Vérifie d'abord que le cookie "verified_email" correspond à l'email du formulaire,
 * puis crée l'utilisateur en base et pose le cookie de session.
 *
 * @param formData - Les données du formulaire d'inscription complet
 * @returns Le résultat de la création du compte (succès ou message d'erreur)
 */
export async function signUpAction(formData: FormData) {
    // Récupération de l'email soumis dans le formulaire
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();

    // Lecture du cookie "verified_email" posé lors de la vérification du code
    const cookieStore = await cookies();
    const verifiedEmail = cookieStore.get("verified_email")?.value;

    // Sécurité : bloquer l'inscription si l'email n'a pas été vérifié ou ne correspond pas
    if (!verifiedEmail || verifiedEmail !== email) {
        return { success: false, error: "Veuillez vérifier votre email avant de continuer." };
    }

    // Extraction et conversion des autres champs du formulaire
    const name     = formData.get("name") as string;
    const password = formData.get("password") as string;
    const phone    = formData.get("phone") as string;
    const ageStr   = formData.get("age") as string;
    // Conversion de l'âge en nombre entier (undefined si absent ou invalide)
    const age      = ageStr ? parseInt(ageStr) : undefined;
    const gender   = formData.get("gender") as string;

    // Appel du backend pour créer le compte en base de données
    const result = await signUp({
        name, email, password, phone,
        // Vérification supplémentaire : on s'assure que l'âge est un nombre valide
        age: isNaN(Number(age)) ? undefined : Number(age),
        gender
    });

    if (result.success && result.user) {
        await setSessionCookies({ id: result.user.id, role: result.user.role });
        // Suppression du cookie temporaire de vérification d'email (il n'est plus nécessaire)
        cookieStore.delete("verified_email");
    }

    return result;
}
