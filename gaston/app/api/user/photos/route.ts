// Route API pour récupérer les photos associées à l'utilisateur connecté.
// Expose une méthode GET qui retourne la liste des photos de l'utilisateur.

import { getUserPhotos } from "@/backend/admin/photos";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/user/photos — Retourne toutes les photos liées à l'utilisateur connecté
export async function GET() {
    const user = await requireRole(Role.USER);
    if (!user) return unauthorized("Non authentifie.");

    // Charge les photos via la couche backend et les retourne directement
    const photos = await getUserPhotos(user.id);
    return Response.json(photos);
}
