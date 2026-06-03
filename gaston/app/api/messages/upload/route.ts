// Route API pour l'upload de fichiers dans le contexte de la messagerie.
// Accepte les images, fichiers audio et fichiers génériques jusqu'à 25 Mo.

import { writeFile } from "fs/promises";
import { join } from "path";
import { ensureUploadDir, getUploadUrl } from "@/lib/uploads";
import { requireAuth, unauthorized } from "@/lib/auth";

// POST /api/messages/upload — Reçoit un fichier joint à un message et le sauvegarde sur le serveur
export async function POST(request: Request) {
    const user = await requireAuth();
    if (!user) return unauthorized("Non authentifie.");

    // Lit les données du formulaire multipart (le fichier est attendu sous la clé "file")
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ success: false, error: "Aucun fichier." }, { status: 400 });

    // Limite la taille du fichier à 25 Mo (plus permissif que l'avatar car peut inclure des audios)
    if (file.size > 25 * 1024 * 1024)
        return Response.json({ success: false, error: "Fichier trop lourd (max 25 Mo)." }, { status: 400 });

    // Détermine le type de média pour faciliter l'affichage côté client
    let mediaType: "image" | "audio" | "file" = "file"; // Par défaut : fichier générique
    if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("audio/")) mediaType = "audio";

    // Génère un nom de fichier unique avec un préfixe "msg_", timestamp et suffixe aléatoire
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const filename = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    // Détermine le dossier de destination dédié aux pièces jointes de messages
    const uploadDir = await ensureUploadDir("messages");

    // Convertit le fichier en buffer et l'écrit sur le disque
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    // Retourne l'URL publique, le type de média et le nom d'origine du fichier
    return Response.json({
        success:   true,
        url:       getUploadUrl(filename, "messages"), // URL accessible depuis le navigateur
        mediaType,                                   // "image", "audio" ou "file"
        fileName:  file.name,                        // Nom original du fichier (pour l'affichage)
    });
}
