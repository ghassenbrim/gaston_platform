// Route API pour l'upload de fichiers par l'administrateur.
// Accepte des images, vidéos et PDF.

import { writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest } from "next/server";
import { ensureUploadDir, getUploadUrl } from "@/lib/uploads";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isAllowedUpload(file: File) {
  const ext = getExtension(file.name);
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
  ];
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "m4v", "pdf"];

  return allowedMimeTypes.includes(file.type) || allowedExtensions.includes(ext);
}

function isVideoUpload(file: File) {
  const ext = getExtension(file.name);
  return file.type.startsWith("video/") || ["mp4", "webm", "mov", "m4v"].includes(ext);
}

// POST /api/admin/upload — Reçoit un fichier et le sauvegarde dans le dossier public/uploads
export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    // Lit les données du formulaire multipart
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // Vérifie qu'un fichier est bien présent dans la requête
    if (!file) {
      return Response.json({ success: false, error: "Aucun fichier reçu." }, { status: 400 });
    }

    if (!isAllowedUpload(file)) {
      return Response.json({ success: false, error: "Format non supporté. Utilisez JPG, PNG, WebP, MP4, WebM, MOV ou PDF." }, { status: 400 });
    }

    const isVideo = isVideoUpload(file);
    const maxSize = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ success: false, error: `Fichier trop lourd (max ${isVideo ? "200" : "20"} Mo).` }, { status: 400 });
    }

    // Génère un nom de fichier unique basé sur le timestamp et un identifiant aléatoire
    // pour éviter tout conflit entre fichiers portant le même nom original
    const ext = getExtension(file.name) || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Chemin de destination configurable pour Railway Volume ou stockage local
    const uploadDir = await ensureUploadDir();

    // Convertit le fichier en buffer et l'écrit sur le disque
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    // Retourne le chemin public accessible par le navigateur
    return Response.json({ success: true, path: getUploadUrl(filename) });
  } catch (e) {
    // Capture les erreurs inattendues et les journalise
    console.error("Upload error:", e);
    return Response.json({ success: false, error: "Erreur lors de l'upload." }, { status: 500 });
  }
}
