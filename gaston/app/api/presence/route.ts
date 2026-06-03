// Route API pour la gestion de la présence en ligne des utilisateurs.
// Utilise un stockage en mémoire partagé (variable globale) pour persister les données entre les requêtes Next.js.
// Expose deux méthodes : POST (heartbeat du client) et GET (liste des utilisateurs en ligne).

import { requireAuth, unauthorized } from "@/lib/auth";

// ─── Stockage en mémoire de la présence ───────────────────────────────────────
// Map<userId, lastSeenTimestamp> — associe chaque userId au timestamp de son dernier heartbeat
// On utilise une variable globale (module-level) pour persister entre les requêtes Next.js
// (les modules Next.js peuvent être réinstanciés, donc on stocke sur globalThis)
const presenceMap = (globalThis as typeof globalThis & { __presenceMap?: Map<string, number> }).__presenceMap
    ?? (((globalThis as typeof globalThis & { __presenceMap?: Map<string, number> }).__presenceMap) = new Map<string, number>());

// Durée maximale d'inactivité avant qu'un utilisateur soit considéré hors ligne (60 secondes)
const ONLINE_THRESHOLD_MS = 60_000; // 60 secondes

// ─── POST /api/presence — Heartbeat envoyé par le client pour signaler sa présence ────────────────────────
export async function POST() {
    const user = await requireAuth();
    if (!user) return unauthorized("Non authentifie.");

    // Met à jour le timestamp de dernière activité pour cet utilisateur
    presenceMap.set(user.id, Date.now());
    return Response.json({ success: true });
}

// ─── GET /api/presence — Retourne la liste des identifiants des utilisateurs actuellement en ligne ───────────────────────
export async function GET() {
    const now = Date.now();
    const onlineIds: string[] = [];

    // Parcourt tous les utilisateurs enregistrés dans la map de présence
    for (const [uid, lastSeen] of presenceMap.entries()) {
        if (now - lastSeen <= ONLINE_THRESHOLD_MS) {
            // L'utilisateur a envoyé un heartbeat dans la fenêtre de 60 secondes : il est en ligne
            onlineIds.push(uid);
        } else {
            // L'utilisateur n'a pas envoyé de heartbeat récent : on le retire de la map (nettoyage automatique)
            presenceMap.delete(uid);
        }
    }

    return Response.json({ success: true, onlineIds });
}
