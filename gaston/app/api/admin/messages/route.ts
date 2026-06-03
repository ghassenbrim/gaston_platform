// Route API pour la messagerie côté administrateur.
// Permet à l'admin de consulter les conversations et d'envoyer des messages aux utilisateurs.

import { getAdminConversations, getConversation, sendAdminMessage } from "@/backend/admin/messages";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/admin/messages          → Retourne la liste de toutes les conversations de l'admin
// GET /api/admin/messages?userId=x → Retourne les messages d'une conversation spécifique avec un utilisateur
export async function GET(request: Request) {
    // Vérifie que l'appelant est bien un administrateur
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    // Lit le paramètre "userId" dans l'URL pour savoir si on veut une conversation précise
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
        // Si un userId est fourni, on retourne les messages de cette conversation uniquement
        const messages = await getConversation(admin.id, userId);
        return Response.json({ success: true, data: messages });
    }

    // Sinon, on retourne la liste de toutes les conversations de l'admin
    const conversations = await getAdminConversations(admin.id);
    return Response.json({ success: true, data: conversations });
}

// POST /api/admin/messages → Envoie un message de l'admin vers un utilisateur
export async function POST(request: Request) {
    // Vérifie que l'appelant est bien un administrateur
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    // Extrait les champs du corps de la requête :
    // receiverId = destinataire, content = texte, mediaUrl/mediaType/fileName = pièce jointe,
    // replyToId = identifiant du message auquel on répond
    const { receiverId, content, mediaUrl, mediaType, fileName, replyToId } = await request.json();

    // Vérifie la présence du destinataire et qu'il y a au moins un contenu texte ou média
    if (!receiverId || (!content?.trim() && !mediaUrl)) {
        return Response.json({ success: false, error: "Données manquantes." }, { status: 400 });
    }

    // Construit l'objet média uniquement s'il y a une URL de fichier joint
    const media = mediaUrl ? { mediaUrl, mediaType, fileName } : undefined;

    // Envoie le message via la couche backend
    const result = await sendAdminMessage(admin.id, receiverId, content?.trim() ?? "", media, replyToId);
    return Response.json(result);
}
