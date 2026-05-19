import { NextResponse } from "next/server";
import { cleanupExpiredReservations } from "@/backend/admin/reservations";

export async function GET(request: Request) {
    const secret = new URL(request.url).searchParams.get("secret");

    if (secret !== process.env.CLEANUP_SECRET) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    await cleanupExpiredReservations();
    return NextResponse.json({ success: true, message: "Nettoyage effectué." });
}
