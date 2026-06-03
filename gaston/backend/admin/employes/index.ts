import { prisma } from "@/lib/prisma";
import { Role, WorkStatus } from "@prisma/client";
import { hashPassword } from "@/lib/password";

/**
 * Récupère la liste complète des employés avec leurs informations de base.
 * Les employés sont identifiés par leur rôle EMPLOYEE dans la table User,
 * et leur profil détaillé est stocké dans la table Employee liée.
 * Les initiales sont calculées automatiquement pour l'affichage des avatars.
 *
 * @returns Un tableau d'objets employés formatés pour l'affichage, ou un tableau vide en cas d'erreur.
 */
export const getEmployees = async () => {
    try {
        const employees = await prisma.user.findMany({
            where: {
                role: Role.EMPLOYEE, // Filtre uniquement les comptes de type employé
            },
            include: {
                Employee: true, // Inclut le profil détaillé (prénom, nom, poste, IBAN…)
            },
            orderBy: { createdAt: "desc" } // Les plus récents en premier
        });

        return employees.map(user => {
            // Récupération du prénom : depuis Employee si disponible, sinon extrait du nom User
            const firstName = user.Employee?.firstName || user.name?.split(" ")[0] || "";
            // Récupération du nom de famille : depuis Employee, ou le reste du nom User
            const lastName =
                user.Employee?.lastName ||
                user.name?.split(" ").slice(1).join(" ") ||
                "";

            return {
                // On préfère l'ID de l'entité Employee pour les opérations métier
                id: user.Employee?.id || user.id,
                prenom: firstName,
                nom: lastName,
                email: user.email,
                // Le poste affiché est défini dans Employee, avec "Employé" par défaut
                role: user.Employee?.position || "Employé",
                // Formatage de la date d'entrée en format court français (ex: "15 avr. 2025")
                dateEntree: new Date(user.createdAt).toLocaleDateString("fr-FR", {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                statut: "Actif",
                // Calcul des initiales à partir des premières lettres du prénom et du nom (en majuscules)
                initiales: ((firstName[0] || user.email[0] || "") + (lastName[0] || user.email[1] || "")).toUpperCase(),
            };
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des employés:", error);
        return [];
    }
};

/**
 * Crée un nouvel employé dans le système.
 * Opération atomique (transaction Prisma) qui crée simultanément :
 *  1. Un compte User avec le rôle EMPLOYEE
 *  2. Un profil Employee lié au User
 * Vérifie au préalable qu'aucun autre compte n'utilise le même email.
 *
 * @param data - Les informations de l'employé : prénom, nom, email, téléphone, mot de passe et poste.
 * @returns { success: true, employee } ou { success: false, error } si l'email est déjà pris ou en cas d'erreur.
 */
export const createEmployee = async (data: {
    prenom: string;
    nom: string;
    email: string;
    phone: string;
    password: string;
    role: string; // Correspond au poste occupé (ex: "Photographe", "Assistant")
}) => {
    try {
        const normalizedEmail = data.email.trim().toLowerCase();
        // Vérification de l'unicité de l'email avant toute création
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return { success: false, error: "Cet email est déjà utilisé." };
        }

        // Transaction Prisma : les deux créations (User + Employee) doivent réussir ensemble
        const result = await prisma.$transaction(async (tx) => {
            // Étape 1 : Création du compte utilisateur avec le rôle EMPLOYEE
            const user = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    name: `${data.prenom} ${data.nom}`,
                    phone: data.phone,
                    password: await hashPassword(data.password),
                    role: Role.EMPLOYEE,
                }
            });

            // Étape 2 : Création du profil employé lié au compte User créé
            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    firstName: data.prenom,
                    lastName: data.nom,
                    position: data.role, // "role" dans le formulaire correspond au poste de l'employé
                }
            });

            return employee;
        });

        return { success: true, employee: result };
    } catch (error) {
        console.error("Erreur lors de la création de l'employé:", error);
        return { success: false, error: "Impossible de créer l'employé." };
    }
};

/**
 * Enregistre une nouvelle journée de travail pour un employé existant.
 * Le statut initial est défini par le paramètre (typiquement PENDING).
 *
 * @param data - Les données de la journée : identifiant employé, date, heures travaillées, description et statut.
 * @returns { success: true, workDay } ou { success: false, error } en cas d'échec.
 */
export const addWorkDay = async (data: {
    employeeId: string;
    date: Date;
    hours: number;
    description: string;
    status: WorkStatus; // Énumération Prisma : PENDING | APPROVED | PAID
}) => {
    try {
        const workDay = await prisma.workDay.create({
            data: {
                employeeId: data.employeeId,
                date: data.date,
                hours: data.hours,
                description: data.description,
                status: data.status,
            }
        });

        return { success: true, workDay };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la journée:", error);
        return { success: false, error: "Impossible d'enregistrer la journée." };
    }
};

/**
 * Supprime un employé et toutes les données associées à son compte.
 * Opération en transaction Prisma pour garantir la cohérence des données.
 * Supprime dans l'ordre : journées de travail, paiements, profil Employee, compte User.
 *
 * @param employeeId - L'identifiant de l'entité Employee (pas l'userId).
 * @returns { success: true } ou { success: false, error } en cas d'échec.
 */
export const deleteEmployee = async (employeeId: string) => {
    try {
        // Récupération de l'userId associé pour pouvoir supprimer le compte User
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { userId: true }
        });

        if (!employee) throw new Error("Employé non trouvé");

        // Suppression en cascade dans une transaction pour éviter les données orphelines
        await prisma.$transaction([
            prisma.workDay.deleteMany({ where: { employeeId } }),          // Journées de travail
            prisma.payment.deleteMany({ where: { employeeId } }),          // Paiements
            prisma.employee.delete({ where: { id: employeeId } }),         // Profil employé
            prisma.user.delete({ where: { id: employee.userId } }),        // Compte utilisateur
        ]);

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de l'employé:", error);
        return { success: false, error: "Impossible de supprimer l'employé." };
    }
};
