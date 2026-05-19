import { prisma } from "@/lib/prisma";
import { createNotification } from "@/backend/user/notification";

/**
 * Récupère tous les messages impliquant un utilisateur,
 * qu'il soit l'expéditeur (sender) ou le destinataire (receiver).
 * Les messages sont triés du plus récent au plus ancien.
 * Les informations de l'expéditeur et du destinataire sont incluses (nom et email).
 *
 * @param userId - L'identifiant de l'utilisateur concerné.
 * @returns La liste des messages avec les données des participants, ou un tableau vide en cas d'erreur.
 */
export const getMessages = async (userId: string) => {
    try {
        return await prisma.message.findMany({
            where: {
                // Clause OR : on récupère les messages dont l'utilisateur est soit l'envoyeur, soit le destinataire
                OR: [
                    { receiverId: userId },
                    { senderId: userId }
                ]
            },
            include: {
                // Inclusion des données de l'expéditeur (nom et email uniquement)
                sender: { select: { name: true, email: true } },
                // Inclusion des données du destinataire (nom et email uniquement)
                receiver: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des messages:", error);
        // Retourne un tableau vide pour éviter un crash côté interface
        return [];
    }
};

/**
 * Envoie un message d'un utilisateur vers un autre.
 * Après l'envoi, une notification est automatiquement créée pour le destinataire.
 *
 * @param data - Contient l'identifiant de l'expéditeur, du destinataire et le contenu du message.
 * @returns Un objet { success: true, message } en cas de succès, ou { success: false, error } en cas d'échec.
 */
export const sendMessage = async (data: {
    senderId: string;
    receiverId: string;
    content: string;
}) => {
    try {
        // Création du message en base de données
        const message = await prisma.message.create({
            data: {
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content
            }
        });

        // Notification pour le destinataire : l'informe qu'il a reçu un nouveau message
        await createNotification(
            data.receiverId,
            "message",
            "Vous avez reçu un nouveau message.",
            message.id // Référence vers le message créé pour permettre la navigation directe
        );

        return { success: true, message };
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        return { success: false, error: "Impossible d'envoyer le message." };
    }
};
