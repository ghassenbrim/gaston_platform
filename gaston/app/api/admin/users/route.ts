import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users?search=xxx → chercher utilisateurs et employés
export async function GET(request: Request) {
    const userId = (await cookies()).get("userId")?.value;
    if (!userId) return Response.json({ success: false, error: "Non autorisé." }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") return Response.json({ success: false, error: "Non autorisé." }, { status: 401 });

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
