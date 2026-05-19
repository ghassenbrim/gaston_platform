import { prisma } from "@/lib/prisma";
import { createNotification } from "@/backend/user/notification";

function isVideoUrl(url: string) {
    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

export const getUserPhotos = async (userId: string) => {
    try {
        const photos = await prisma.photo.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return photos.map(p => {
            const mediaType = p.mediaType === "video" || isVideoUrl(p.url) ? "video" : "image";

            return {
                id: p.id,
                url: p.url,
                category: p.category || "Général",
                mediaType,
                aspectRatio: p.aspectRatio,
                createdAt: p.createdAt.toLocaleDateString("fr-FR"),
            };
        });
    } catch (error) {
        console.error("Erreur getUserPhotos:", error);
        return [];
    }
};

export const addPhotoToUser = async (
    userId: string,
    url: string,
    category: string,
    mediaType: "image" | "video" = "image",
    aspectRatio?: "16:9" | "9:16" | null,
) => {
    try {
        let photo;
        try {
            photo = await prisma.photo.create({
                data: { userId, url, category, mediaType, aspectRatio },
            });
        } catch (createError) {
            console.error("Erreur addPhotoToUser avec champs média:", createError);
            photo = await prisma.photo.create({
                data: { userId, url, category },
            });
        }

        // Notification automatique pour l'utilisateur
        await createNotification(
            userId,
            "photo",
            `${mediaType === "video" ? "Nouvelle vidéo disponible" : "Nouvelle photo disponible"} dans votre galerie${category ? ` — catégorie : ${category}` : ""}.`,
            photo.id
        );
        return { success: true, photo };
    } catch (error) {
        console.error("Erreur addPhotoToUser:", error);
        return { success: false, error: "Impossible d'ajouter le média." };
    }
};

export const deletePhoto = async (photoId: string) => {
    try {
        await prisma.photo.delete({ where: { id: photoId } });
        return { success: true };
    } catch (error) {
        console.error("Erreur deletePhoto:", error);
        return { success: false, error: "Impossible de supprimer la photo." };
    }
};

export const getUserInfo = async (userId: string) => {
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });
    } catch {
        return null;
    }
};
