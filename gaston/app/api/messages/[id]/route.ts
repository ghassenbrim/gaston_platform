import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const user = await requireAuth();
    if (!user) return unauthorized("Non authentifie.");

    const body = await request.json();
    
    // Vérification droits
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return Response.json({ success: false, error: "Introuvable" }, { status: 404 });
    if (message.senderId !== user.id && message.receiverId !== user.id) {
        return Response.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    try {
        const updateData: any = {};
        if (typeof body.isPinned === "boolean") updateData.isPinned = body.isPinned;
        if (typeof body.reaction !== "undefined") updateData.reaction = body.reaction;

        const updated = await prisma.message.update({
            where: { id },
            data: updateData,
        });
        return Response.json({ success: true, message: updated });
    } catch (e) {
        console.error("PATCH error:", e);
        return Response.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const user = await requireAuth();
    if (!user) return unauthorized("Non authentifie.");

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return Response.json({ success: false, error: "Introuvable" }, { status: 404 });
    
    // Seul l'expéditeur ou l'ADMIN peut supprimer
    if (message.senderId !== user.id && user.role !== "ADMIN") {
        return Response.json({ success: false, error: "Non autorisé à supprimer" }, { status: 403 });
    }

    try {
        await prisma.message.update({
            where: { id },
            data: { isDeleted: true },
        });
        return Response.json({ success: true });
    } catch (e) {
        console.error("DELETE error:", e);
        return Response.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 });
    }
}
