// Route API pour la gestion des notifications de l'utilisateur connecté.
// Expose deux méthodes : GET (liste des notifications) et PATCH (marquer comme lu).

import { getNotifications, markAsRead, markAllAsRead } from "@/backend/user/notification";
import { requireAuth, unauthorized } from "@/lib/auth";

// GET /api/user/notifications — Retourne toutes les notifications de l'utilisateur
export async function GET() {
    const user = await requireAuth();
    if (!user) return unauthorized("Non authentifie.");

    // Charge et retourne les notifications depuis la couche backend
    const notifications = await getNotifications(user.id);
    return Response.json(notifications);
}

// PATCH /api/user/notifications — Marque une ou toutes les notifications comme lues
// Corps attendu : { all: true } pour tout marquer, ou { id: string } pour une seule
export async function PATCH(req: Request) {
    const user = await requireAuth();
    if (!user) return unauthorized("Non authentifie.");

    const body = await req.json();

    // Si le flag "all" est vrai, on marque toutes les notifications comme lues
    if (body.all === true) {
        const result = await markAllAsRead(user.id);
        return Response.json(result);
    }

    // Si un identifiant est fourni, on marque uniquement cette notification comme lue
    if (body.id) {
        const result = await markAsRead(body.id, user.id);
        return Response.json(result);
    }

    // Aucun paramètre valide fourni
    return Response.json({ error: "Paramètre manquant." }, { status: 400 });
}
