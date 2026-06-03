import { getQuoteConfig, resetQuoteConfig, saveQuoteConfig } from "@/backend/admin/quoteConfig";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    const config = await getQuoteConfig();
    return Response.json(config);
}

export async function PUT(request: Request) {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    const config = await request.json();
    const result = await saveQuoteConfig(config);
    return Response.json(result, { status: result.success ? 200 : 500 });
}

export async function DELETE() {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    const result = await resetQuoteConfig();
    return Response.json(result, { status: result.success ? 200 : 500 });
}
