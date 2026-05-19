// Route API pour récupérer les photos associées à l'utilisateur connecté.
// Expose une méthode GET qui retourne la liste des photos de l'utilisateur.

import { cookies } from "next/headers";
import { getUserPhotos } from "@/backend/admin/photos";

// GET /api/user/photos — Retourne toutes les photos liées à l'utilisateur connecté
export async function GET() {
    // Lit le cookie de session pour identifier l'utilisateur
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    // Retourne une erreur 401 si aucun cookie de session n'est présent
    if (!userId) return Response.json({ error: "Non authentifié." }, { status: 401 });

    // Charge les photos via la couche backend et les retourne directement
    const photos = await getUserPhotos(userId);
    return Response.json(photos);
}
