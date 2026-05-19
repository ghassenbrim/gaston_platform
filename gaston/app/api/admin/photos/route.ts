import { getUserPhotos, addPhotoToUser, deletePhoto } from "@/backend/admin/photos";

// GET  /api/admin/photos?userId=xxx
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId manquant." }, { status: 400 });
    const photos = await getUserPhotos(userId);
    return Response.json(photos);
}

// POST /api/admin/photos  { userId, url, category, mediaType, aspectRatio }
export async function POST(request: Request) {
    const { userId, url, category, mediaType, aspectRatio } = await request.json();
    if (!userId || !url) return Response.json({ success: false, error: "Champs manquants." }, { status: 400 });
    const result = await addPhotoToUser(userId, url, category || "Général", mediaType === "video" ? "video" : "image", aspectRatio);
    return Response.json(result, { status: result.success ? 201 : 500 });
}

// DELETE /api/admin/photos  { photoId }
export async function DELETE(request: Request) {
    const { photoId } = await request.json();
    if (!photoId) return Response.json({ success: false, error: "photoId manquant." }, { status: 400 });
    const result = await deletePhoto(photoId);
    return Response.json(result, { status: result.success ? 200 : 500 });
}
