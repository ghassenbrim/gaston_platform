import { cookies } from "next/headers";
import {
    getAdminProfile,
    updateAdminProfile,
    updateAdminPassword,
} from "@/backend/admin/settings";

async function getUserId() {
    const cookieStore = await cookies();
    return cookieStore.get("userId")?.value ?? null;
}

export async function GET() {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await getAdminProfile(userId);
    if (!profile) return Response.json({ error: "Profil introuvable" }, { status: 404 });

    return Response.json(profile);
}

export async function PATCH(request: Request) {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();

    if (body.type === "password") {
        if (!body.currentPassword || !body.newPassword) {
            return Response.json({ success: false, error: "Champs manquants." }, { status: 400 });
        }
        const result = await updateAdminPassword(userId, {
            currentPassword: body.currentPassword,
            newPassword: body.newPassword,
        });
        return Response.json(result, { status: result.success ? 200 : 400 });
    }

    const result = await updateAdminProfile(userId, {
        phone: body.phone || undefined,
        age: body.age ? Number(body.age) : undefined,
        gender: body.gender || undefined,
    });
    return Response.json(result, { status: result.success ? 200 : 400 });
}
