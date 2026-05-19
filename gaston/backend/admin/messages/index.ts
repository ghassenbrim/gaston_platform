import { prisma } from "@/lib/prisma";
import { createNotification } from "@/backend/user/notification";

/**
 * Récupère la liste de toutes les conversations de l'admin,
 * groupées par interlocuteur (un seul objet par utilisateur/employé avec lequel l'admin a échangé).
 * Inclut également le nombre de messages non lus par interlocuteur.
 *
 * @param adminId - L'identifiant de l'administrateur.
 * @returns Un tableau de conversations avec le dernier message, le nombre de non-lus, etc.
 */
export const getAdminConversations = async (adminId: string) => {
    try {
        // Récupération en parallèle : tous les messages + les messages non lus reçus par l'admin
        const [messages, unreadMessages] = await Promise.all([
            prisma.message.findMany({
                where: {
                    // Tous les messages où l'admin est expéditeur ou destinataire
                    OR: [{ senderId: adminId }, { receiverId: adminId }]
                },
                include: {
                    sender:   { select: { id: true, name: true, email: true, role: true, avatar: true } },
                    receiver: { select: { id: true, name: true, email: true, role: true, avatar: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            // Uniquement les messages non lus reçus par l'admin (pour calculer les badges)
            prisma.message.findMany({
                where: { receiverId: adminId, isRead: false },
                select: { senderId: true },
            }),
        ]);

        // Construction d'une map { senderId => nombre de messages non lus } pour chaque expéditeur
        const unreadMap = new Map<string, number>();
        for (const m of unreadMessages) {
            unreadMap.set(m.senderId, (unreadMap.get(m.senderId) ?? 0) + 1);
        }

        // Map qui contiendra une entrée par interlocuteur (identifié par son userId)
        const conversationsMap = new Map<string, {
            userId: string;
            name: string;
            email: string;
            role: string;
            avatar: string | null;
            lastMessage: string;   // Aperçu du dernier message échangé
            lastTime: Date;        // Date du dernier message pour le tri
            unreadCount: number;   // Nombre de messages non lus pour cet interlocuteur
        }>();

        for (const msg of messages) {
            // L'interlocuteur est l'autre partie (pas l'admin lui-même)
            const other = msg.senderId === adminId ? msg.receiver : msg.sender;
            // On n'enregistre que la première occurrence (= le message le plus récent, grâce au tri DESC)
            if (!conversationsMap.has(other.id)) {
                // Génération d'un aperçu selon le type de media si le contenu texte est vide
                let preview = msg.content;
                if (!preview && msg.mediaType === "audio") preview = "🎙️ Message vocal";
                else if (!preview && msg.mediaType === "image") preview = "🖼️ Image";
                else if (!preview && msg.mediaType === "file")  preview = "📎 Fichier";

                conversationsMap.set(other.id, {
                    userId:      other.id,
                    name:        other.name || other.email,
                    email:       other.email,
                    role:        other.role,
                    avatar:      (other as any).avatar ?? null,
                    lastMessage: preview,
                    lastTime:    msg.createdAt,
                    unreadCount: unreadMap.get(other.id) ?? 0,
                });
            }
        }

        // Conversion de la Map en tableau pour la réponse
        return Array.from(conversationsMap.values());
    } catch (error) {
        console.error("Erreur getAdminConversations:", error);
        return [];
    }
};

/**
 * Récupère les messages d'une conversation spécifique entre l'admin et un autre utilisateur.
 * Les messages sont triés par ordre chronologique (plus ancien en premier).
 * Les messages non lus envoyés par l'interlocuteur sont automatiquement marqués comme lus.
 *
 * @param adminId     - L'identifiant de l'administrateur.
 * @param otherUserId - L'identifiant de l'interlocuteur.
 * @returns La liste des messages de la conversation avec les données des participants et les réponses imbriquées.
 */
export const getConversation = async (adminId: string, otherUserId: string) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                // Tous les messages entre l'admin et l'interlocuteur, dans les deux sens
                OR: [
                    { senderId: adminId,      receiverId: otherUserId },
                    { senderId: otherUserId,  receiverId: adminId     },
                ]
            },
            include: {
                sender:   { select: { id: true, name: true, role: true, avatar: true } },
                receiver: { select: { id: true, name: true, role: true, avatar: true } },
                // Inclusion du message auquel celui-ci répond (fonctionnalité "reply")
                replyTo:  { select: { id: true, content: true, mediaType: true, sender: { select: { name: true, role: true } } } },
            },
            orderBy: { createdAt: "asc" }, // Ordre chronologique pour l'affichage dans le fil de discussion
        });

        // Identification des messages de l'interlocuteur qui ne sont pas encore lus
        const unreadIds = messages
            .filter(m => m.senderId === otherUserId && !m.isRead)
            .map(m => m.id);

        if (unreadIds.length > 0) {
            // Mise à jour en base de données (non-bloquante : on ne attend pas le résultat)
            prisma.message.updateMany({
                where: { id: { in: unreadIds } },
                data: { isRead: true },
            }).catch(err => console.error("Erreur marquage lu:", err));

            // Mise à jour locale de l'objet retourné pour éviter un rechargement côté client
            messages.forEach(m => {
                if (unreadIds.includes(m.id)) m.isRead = true;
            });
        }

        return messages;
    } catch (error) {
        console.error("Erreur getConversation:", error);
        return [];
    }
};

/**
 * Envoie un message de l'admin vers un utilisateur ou un employé.
 * Supporte l'envoi de médias (image, audio, fichier) et les réponses à un message existant.
 * Une notification est créée pour le destinataire après l'envoi.
 *
 * @param adminId    - L'identifiant de l'administrateur expéditeur.
 * @param receiverId - L'identifiant du destinataire.
 * @param content    - Le contenu textuel du message.
 * @param media      - (Optionnel) Données du média joint : URL, type et nom du fichier.
 * @param replyToId  - (Optionnel) Identifiant du message auquel on répond.
 * @returns { success: true, message } ou { success: false, error }.
 */
export const sendAdminMessage = async (
    adminId: string,
    receiverId: string,
    content: string,
    media?: { mediaUrl: string; mediaType: string; fileName?: string },
    replyToId?: string
) => {
    try {
        const message = await prisma.message.create({
            data: {
                senderId: adminId,
                receiverId,
                content,
                // Spread conditionnel : n'ajoute les champs media que s'ils sont fournis
                ...(media ?? {}),
                // Ajout de la référence au message d'origine si c'est une réponse
                ...(replyToId ? { replyToId } : {}),
            },
        });

        // Notification au destinataire pour l'informer du message de l'administration
        await createNotification(receiverId, "message", "Vous avez reçu un message de l'administration.", message.id);
        return { success: true, message };
    } catch (error) {
        console.error("Erreur sendAdminMessage:", error);
        return { success: false, error: "Impossible d'envoyer le message." };
    }
};

/**
 * Récupère les messages échangés entre un utilisateur/employé et l'admin.
 * Identifie automatiquement l'admin par son rôle en base de données.
 * Utilisé côté client (espace utilisateur ou employé) pour la messagerie avec l'administration.
 *
 * @param userId - L'identifiant de l'utilisateur ou de l'employé.
 * @returns Un objet contenant les messages, l'identifiant de l'admin, son nom et son avatar.
 */
export const getUserAdminMessages = async (userId: string) => {
    try {
        // Recherche du premier compte administrateur en base
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, name: true, avatar: true } });
        // Si aucun admin n'existe, on retourne des valeurs par défaut pour ne pas bloquer l'interface
        if (!admin) return { messages: [], adminId: null, adminName: "Administration", adminAvatar: null };

        const messages = await prisma.message.findMany({
            where: {
                // Tous les messages entre l'utilisateur et l'admin, dans les deux sens
                OR: [
                    { senderId: userId,    receiverId: admin.id },
                    { senderId: admin.id,  receiverId: userId   },
                ]
            },
            include: {
                sender:  { select: { id: true, name: true, role: true } },
                // Inclusion du message d'origine pour les réponses imbriquées
                replyTo: { select: { id: true, content: true, mediaType: true, sender: { select: { name: true, role: true } } } },
            },
            orderBy: { createdAt: "asc" },
        });

        return { messages, adminId: admin.id, adminName: admin.name || "Administration", adminAvatar: admin.avatar ?? null };
    } catch (error) {
        console.error("Erreur getUserAdminMessages:", error);
        return { messages: [], adminId: null, adminName: "Administration" };
    }
};

/**
 * Envoie un message depuis un utilisateur ou un employé vers l'administrateur.
 * L'admin est identifié automatiquement par son rôle.
 * Supporte l'envoi de médias et les réponses à un message existant.
 * Une notification est envoyée à l'admin après réception.
 *
 * @param userId    - L'identifiant de l'expéditeur (utilisateur ou employé).
 * @param content   - Le contenu textuel du message.
 * @param media     - (Optionnel) Données du média joint.
 * @param replyToId - (Optionnel) Identifiant du message auquel on répond.
 * @returns { success: true, message } ou { success: false, error }.
 */
export const sendMessageToAdmin = async (
    userId: string,
    content: string,
    media?: { mediaUrl: string; mediaType: string; fileName?: string },
    replyToId?: string
) => {
    try {
        // Recherche de l'admin en base pour récupérer son identifiant
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
        if (!admin) return { success: false, error: "Administrateur introuvable." };

        const message = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId: admin.id,
                content,
                ...(media ?? {}),
                ...(replyToId ? { replyToId } : {}),
            },
        });

        // Notification à l'admin pour l'informer qu'un utilisateur lui a envoyé un message
        await createNotification(admin.id, "message", "Vous avez reçu un nouveau message.", message.id);
        return { success: true, message };
    } catch (error) {
        console.error("Erreur sendMessageToAdmin:", error);
        return { success: false, error: "Impossible d'envoyer le message." };
    }
};
