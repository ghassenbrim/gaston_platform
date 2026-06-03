import { getCurrentUser } from "@/lib/auth";

/**
 * Verifie uniquement une session deja signee par le serveur.
 * Cette route ne restaure plus une session depuis un userId fourni par le client.
 */
export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) return Response.json({ success: false }, { status: 401 });

        return Response.json({ success: true, role: user.role });
    } catch (error) {
        console.error("[auth/restore] Erreur:", error);
        return Response.json({ success: false }, { status: 401 });
    }
}
