import {
    getAdminProfile,
    updateAdminProfile,
    updateAdminPassword,
} from "@/backend/admin/settings";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized("Non authentifie.");

    const profile = await getAdminProfile(admin.id);
    if (!profile) return Response.json({ error: "Profil introuvable" }, { status: 404 });

    return Response.json(profile);
}

export async function PATCH(request: Request) {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized("Non authentifie.");

    const body = await request.json();

    if (body.type === "password") {
        if (!body.currentPassword || !body.newPassword) {
            return Response.json({ success: false, error: "Champs manquants." }, { status: 400 });
        }
        const result = await updateAdminPassword(admin.id, {
            currentPassword: body.currentPassword,
            newPassword: body.newPassword,
        });
        return Response.json(result, { status: result.success ? 200 : 400 });
    }

    const result = await updateAdminProfile(admin.id, {
        phone: body.phone || undefined,
        age: body.age ? Number(body.age) : undefined,
        gender: body.gender || undefined,
    });
    return Response.json(result, { status: result.success ? 200 : 400 });
}
