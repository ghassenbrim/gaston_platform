// Route API pour la gestion de l'avatar (photo de profil) de l'utilisateur connecté.
// Expose deux méthodes : POST (uploader un nouvel avatar) et DELETE (supprimer l'avatar).

import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { ensureUploadDir, getUploadUrl } from "@/lib/uploads";

// POST /api/user/avatar — Reçoit un fichier image et le sauvegarde comme avatar de l'utilisateur
export async function POST(request: Request) {
    // Vérifie que l'utilisateur est authentifié via le cookie de session
    const userId = (await cookies()).get("userId")?.value;
    if (!userId) return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });

    // Lit les données du formulaire multipart (le fichier image est attendu sous la clé "file")
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ success: false, error: "Aucun fichier." }, { status: 400 });

    // Vérifie que le fichier est bien une image (type MIME commençant par "image/")
    if (!file.type.startsWith("image/"))
        return Response.json({ success: false, error: "Seules les images sont acceptées." }, { status: 400 });

    // Limite la taille du fichier à 5 Mo pour éviter les abus
    if (file.size > 5 * 1024 * 1024)
        return Response.json({ success: false, error: "Image trop lourde (max 5 Mo)." }, { status: 400 });

    // Génère un nom de fichier unique basé sur l'userId et le timestamp courant
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `avatar_${userId}_${Date.now()}.${ext}`;

    // Détermine le dossier de destination et le crée si nécessaire
    const uploadDir = await ensureUploadDir("avatars");

    // Convertit le fichier en buffer et l'écrit sur le disque
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    // Construit l'URL publique de l'avatar et met à jour la base de données
    const avatarUrl = getUploadUrl(filename, "avatars");
    await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });

    // Retourne l'URL du nouvel avatar pour que le client puisse l'afficher immédiatement
    return Response.json({ success: true, avatarUrl });
}

// DELETE /api/user/avatar — Supprime l'avatar de l'utilisateur (remet le champ à null)
export async function DELETE() {
    // Vérifie que l'utilisateur est authentifié via le cookie de session
    const userId = (await cookies()).get("userId")?.value;
    if (!userId) return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });

    // Remet le champ avatar à null en base de données (le fichier physique n'est pas supprimé)
    await prisma.user.update({ where: { id: userId }, data: { avatar: null } });
    return Response.json({ success: true });
}
