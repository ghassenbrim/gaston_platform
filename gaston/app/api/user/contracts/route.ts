// Route API pour récupérer les contrats de l'utilisateur connecté.
// Expose une méthode GET qui retourne la liste des contrats triés du plus récent au plus ancien.

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET /api/user/contracts — Retourne tous les contrats liés à l'utilisateur connecté
export async function GET() {
    // Lit le cookie de session pour identifier l'utilisateur
    const store = await cookies();
    const userId = store.get("userId")?.value;
    if (!userId) return Response.json({ error: "Non authentifié." }, { status: 401 });

    // Récupère tous les contrats de l'utilisateur, triés du plus récent au plus ancien
    const contracts = await prisma.contract.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    // Transforme les enregistrements pour n'exposer que les champs utiles au client,
    // et ajoute un indicateur booléen "isPdf" pour faciliter l'affichage côté frontend
    return Response.json(contracts.map(c => ({
        id: c.id,
        url: c.url,                                      // URL du fichier du contrat
        status: c.status,                                // Statut du contrat (ex: signé, en attente)
        createdAt: c.createdAt.toISOString(),             // Date de création au format ISO 8601
        isPdf: c.url.toLowerCase().endsWith(".pdf"),      // Vrai si le fichier est un PDF
    })));
}
