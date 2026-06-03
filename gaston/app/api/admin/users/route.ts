import { prisma } from "@/lib/prisma";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/admin/users?search=xxx → chercher utilisateurs et employés
export async function GET(request: Request) {
    const admin = await requireRole(Role.ADMIN);
    if (!admin) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const users = await prisma.user.findMany({
        where: {
            role: { in: ["USER", "EMPLOYEE"] },
            ...(search ? {
                OR: [
                    { name:  { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ]
            } : {}),
        },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
        take: 20,
    });

    return Response.json({ success: true, data: users });
}
