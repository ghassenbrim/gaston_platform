// Importation du client Prisma pour interagir avec la base de données
import { prisma } from "@/lib/prisma";
// Importation de l'énumération des rôles définie dans le schéma Prisma
import { Role } from "@prisma/client";
// Importation des utilitaires d'envoi d'email et de SMS de vérification
import { sendVerificationEmail } from "@/lib/mail";
import { sendVerificationSMS } from "@/lib/sms";

/**
 * Génère un code de vérification aléatoire à 6 chiffres.
 * Utilisé pour la vérification par email et par SMS.
 */
function generateCode(): string {
    // Génère un entier entre 100000 et 999999, puis le convertit en chaîne
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envoie un code de vérification à l'email donné.
 * Supprime d'abord tout code existant pour cet email,
 * crée un nouveau code valable 10 minutes, puis envoie l'email.
 */
export const sendVerificationCode = async (email: string) => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        // Génération du code à 6 chiffres
        const code = generateCode();
        // Date d'expiration : maintenant + 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Supprimer les anciens codes pour cet email afin d'éviter les doublons
        await prisma.verificationCode.deleteMany({
            where: { email: normalizedEmail }
        });

        // Créer le nouveau code de vérification en base de données
        await prisma.verificationCode.create({
            data: {
                email: normalizedEmail,
                code,
                expiresAt
            }
        });

        // Log du code en développement pour tester sans SMTP
        // (permet de récupérer le code sans avoir besoin d'un serveur mail réel)
        if (process.env.NODE_ENV === "development") {
            console.log(`\n[DEV] Code de verification pour ${normalizedEmail}: ${code}\n`);
        }

        // Envoyer l'email contenant le code de vérification
        const emailResult = await sendVerificationEmail(normalizedEmail, code);

        // Si l'envoi échoue, retourner une erreur explicite
        if (!emailResult.success) {
            return { success: false, error: "Erreur lors de l'envoi de l'email." };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la génération du code de vérification:", error);
        return { success: false, error: "Une erreur est survenue." };
    }
};

/**
 * Envoie un code de vérification par SMS au numéro donné.
 * Fonctionne de la même façon que sendVerificationCode,
 * mais utilise la table PhoneVerificationCode et l'envoi SMS.
 */
export const sendPhoneVerificationCode = async (phone: string) => {
    try {
        // Génération d'un code à 6 chiffres pour le téléphone
        const code = generateCode();
        // Expiration dans 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Supprimer l'éventuel code SMS précédent pour ce numéro
        await prisma.phoneVerificationCode.deleteMany({ where: { phone } });
        // Sauvegarder le nouveau code SMS en base de données
        await prisma.phoneVerificationCode.create({ data: { phone, code, expiresAt } });

        // Afficher le code dans la console en mode développement (pas d'envoi SMS réel requis)
        if (process.env.NODE_ENV === "development") {
            console.log(`\n📱 [DEV] Code SMS pour ${phone}: ${code}\n`);
        }

        // Envoyer le SMS contenant le code de vérification
        const smsResult = await sendVerificationSMS(phone, code);
        // Retourner l'erreur de l'envoi SMS si elle existe
        if (!smsResult.success) {
            return { success: false, error: smsResult.error || "Erreur lors de l'envoi du SMS." };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'envoi du code SMS:", error);
        return { success: false, error: "Une erreur est survenue." };
    }
};

/**
 * Vérifie si le code SMS fourni est valide pour le numéro donné.
 * Contrôle l'existence du code en base et sa date d'expiration.
 */
export const verifyPhoneCode = async (phone: string, code: string) => {
    try {
        // Recherche du code SMS correspondant au couple (téléphone, code)
        const verification = await prisma.phoneVerificationCode.findUnique({
            where: { phone_code: { phone, code } }
        });

        // Si aucun enregistrement trouvé, le code est invalide
        if (!verification) return { success: false, error: "Code invalide." };
        // Si la date d'expiration est dépassée, le code est expiré
        if (verification.expiresAt < new Date()) return { success: false, error: "Le code a expiré." };

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la vérification du code SMS:", error);
        return { success: false, error: "Une erreur est survenue lors de la vérification." };
    }
};

/**
 * Vérifie si le code fourni est valide pour l'email donné.
 * Recherche le code en base et vérifie qu'il n'est pas expiré.
 */
export const verifyCode = async (email: string, code: string) => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        // Recherche du code de vérification correspondant au couple (email, code)
        const verification = await prisma.verificationCode.findUnique({
            where: {
                email_code: {
                    email: normalizedEmail,
                    code
                }
            }
        });

        // Code introuvable en base de données
        if (!verification) {
            return { success: false, error: "Code invalide." };
        }

        // Le code existe mais sa durée de validité (10 min) est dépassée
        if (verification.expiresAt < new Date()) {
            return { success: false, error: "Le code a expiré." };
        }

        // Optionnel: On pourrait supprimer le code ici après vérification réussie
        // Mais il est préférable de le garder jusqu'au signUp effectif.

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la vérification du code:", error);
        return { success: false, error: "Une erreur est survenue lors de la vérification." };
    }
};

/**
 * Gère la connexion d'un utilisateur.
 * Vérifie l'email et le mot de passe, puis retourne les informations
 * de l'utilisateur avec son rôle normalisé en majuscules.
 * Note: En production, hachez les mots de passe.
 */
export const signIn = async (email: string, password: string) => {
    try {
        // Recherche de l'utilisateur par email, en incluant son éventuel profil Employé
        const user = await prisma.user.findUnique({
            where: { email },
            include: { Employee: true }
        });

        console.log(`[signIn] Recherche utilisateur: ${email}`);
        console.log(`[signIn] Utilisateur trouvé:`, user ? { id: user.id, role: user.role, employeeExists: !!user.Employee } : "NOT_FOUND");

        // Si aucun utilisateur ne correspond à cet email
        if (!user) {
            console.warn(`[signIn] Email non trouvé: ${email}`);
            return { success: false, error: "Email ou mot de passe incorrect" };
        }

        // Vérification du mot de passe (comparaison en clair — à remplacer par bcrypt en production)
        if (user.password !== password) {
            console.warn(`[signIn] Mot de passe incorrect pour ${email}`);
            return { success: false, error: "Email ou mot de passe incorrect" };
        }

        // Normalisation du rôle en majuscules pour garantir la cohérence (ex: "admin" → "ADMIN")
        const roleValue = String(user.role).toUpperCase();
        console.log(`[signIn] Connexion réussie pour ${email}. Role type: ${typeof user.role}, Value: "${user.role}", Normalized: "${roleValue}"`);

        // Retourner les données essentielles de l'utilisateur (sans le mot de passe)
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: roleValue
            }
        };
    } catch (error) {
        console.error(`Erreur lors de la connexion pour ${email}:`, error);
        return { success: false, error: "Une erreur est survenue lors de la connexion." };
    }
};

/**
 * Gère l'inscription d'un nouvel utilisateur (Client).
 * Vérifie que l'email n'est pas déjà utilisé, puis crée
 * l'utilisateur en base de données avec le rôle USER par défaut.
 */
export const signUp = async (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    age?: number;
    gender?: string;
}) => {
    try {
        // Vérifier si un compte existe déjà avec cet email
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        // Empêcher la création d'un doublon
        if (existingUser) {
            return { success: false, error: "Cet email est déjà utilisé." };
        }

        // Création du nouvel utilisateur en base de données
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password, // À hacher en production avec bcrypt
                phone: data.phone,
                age: data.age,
                gender: data.gender,
                role: Role.USER, // Par défaut, un nouvel inscrit est un Client/USER
            }
        });

        return { success: true, user };
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        return { success: false, error: "Impossible de créer le compte." };
    }
};
