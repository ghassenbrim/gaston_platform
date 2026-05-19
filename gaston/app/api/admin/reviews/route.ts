import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const admin = await prisma.user.findUnique({ where: { id: userId } });
        if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const reviews = await prisma.review.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });

        // Formater les dates pour l'affichage
        const formattedReviews = reviews.map(r => ({
            ...r,
            createdAt: r.createdAt.toLocaleDateString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric"
            })
        }));

        return NextResponse.json(formattedReviews);
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const admin = await prisma.user.findUnique({ where: { id: userId } });
        if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const { id, isApproved } = await request.json();
        if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

        const review = await prisma.review.update({
            where: { id },
            data: { isApproved },
        });

        return NextResponse.json({ success: true, review });
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
