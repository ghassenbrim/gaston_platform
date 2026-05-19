// Route API pour la gestion des photos favorites de l'utilisateur connecté.
// Expose deux méthodes : GET (liste des favoris) et POST (toggle favori).

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Fonction utilitaire : récupère l'identifiant de l'utilisateur depuis le cookie de session
async function getUserId() {
    const store = await cookies();
    return store.get("userId")?.value ?? null;
}

// GET /api/user/favorites — Retourne la liste des identifiants de photos mis en favori
export async function GET() {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Non authentifié." }, { status: 401 });

    // Récupère tous les favoris de l'utilisateur en base de données
    const favs = await prisma.favorite.findMany({ where: { userId } });

    // Retourne uniquement les identifiants des photos (targetId), pas les enregistrements complets
    return Response.json(favs.map(f => f.targetId));
}

// POST /api/user/favorites — Ajoute ou supprime un favori (toggle) pour une photo donnée
// Corps attendu : { photoId: string }
export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Non authentifié." }, { status: 401 });

    const { photoId } = await req.json();
    if (!photoId) return Response.json({ error: "photoId manquant." }, { status: 400 });

    // Vérifie si le favori existe déjà pour cet utilisateur et cette photo
    const existing = await prisma.favorite.findFirst({ where: { userId, targetId: photoId } });

    if (existing) {
        // Le favori existe : on le supprime (désactivation)
        await prisma.favorite.delete({ where: { id: existing.id } });
        return Response.json({ success: true, action: "removed" });
    } else {
        // Le favori n'existe pas : on le crée (activation)
        await prisma.favorite.create({ data: { userId, targetId: photoId } });
        return Response.json({ success: true, action: "added" });
    }
}
