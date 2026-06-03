// Route API pour la messagerie entre un utilisateur et l'administrateur.
// Expose deux méthodes : GET (lire les messages) et POST (envoyer un message).

import { getUserAdminMessages, sendMessageToAdmin } from "@/backend/admin/messages";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/user/messages — Récupère les messages échangés entre cet utilisateur et l'admin
export async function GET() {
    const user = await requireRole(Role.USER);
    if (!user) return unauthorized("Non authentifie.");

    // Charge la conversation entre l'utilisateur et l'admin via la couche backend
    const result = await getUserAdminMessages(user.id);
    return Response.json({ success: true, ...result });
}

// POST /api/user/messages — Envoie un nouveau message à l'admin
export async function POST(request: Request) {
    const user = await requireRole(Role.USER);
    if (!user) return unauthorized("Non authentifie.");

    // Extrait les champs du corps de la requête :
    // content = texte du message, mediaUrl = URL du fichier joint,
    // mediaType = type de média, fileName = nom du fichier, replyToId = message auquel on répond
    const { content, mediaUrl, mediaType, fileName, replyToId } = await request.json();

    // Vérifie qu'il y a au minimum un texte ou un média joint
    if (!content?.trim() && !mediaUrl) return Response.json({ success: false, error: "Message vide." }, { status: 400 });

    // Construit l'objet média uniquement s'il y a une URL de fichier joint
    const media = mediaUrl ? { mediaUrl, mediaType, fileName } : undefined;

    // Envoie le message via la couche backend
    const result = await sendMessageToAdmin(user.id, content?.trim() ?? "", media, replyToId);
    return Response.json(result);
}
