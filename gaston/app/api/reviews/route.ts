import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const body = await req.json();
        const { quote, rating, eventRole } = body;

        if (!quote || !rating) {
            return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
        }

        const review = await prisma.review.create({
            data: {
                userId: userId,
                quote,
                rating: Number(rating),
                eventRole,
                isApproved: false, // Default to false for moderation
            }
        });

        return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating review:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const reviews = await prisma.review.findMany({
            where: { userId: userId },
            orderBy: { createdAt: "desc" },
        });

        // Formater les dates pour l'affichage
        const formattedReviews = reviews.map((r: any) => ({
            ...r,
            createdAt: r.createdAt.toLocaleDateString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric"
            })
        }));

        return NextResponse.json({ success: true, reviews: formattedReviews }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
