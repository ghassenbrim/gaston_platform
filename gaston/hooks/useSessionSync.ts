"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Synchronise les cookies serveur avec la session de cet onglet (sessionStorage).
 * Quand l'onglet devient actif, restaure les cookies du bon utilisateur.
 */
export function useSessionSync(expectedRole: string) {
    const router = useRouter();

    useEffect(() => {
        const restoreSession = async () => {
            const stored = sessionStorage.getItem("gaston_tab_session");
            if (!stored) {
                console.warn(`[useSessionSync] Pas de session trouvée pour ${expectedRole}`);
                return;
            }

            let session: { userId: string; role: string } | null = null;
            try { session = JSON.parse(stored); } catch (e) {
                console.error("[useSessionSync] Erreur parsing session:", e);
                return;
            }

            if (!session?.userId) {
                console.warn("[useSessionSync] Pas d'userId dans la session");
                return;
            }

            if (session.role !== expectedRole) {
                console.warn(`[useSessionSync] Role mismatch: expected ${expectedRole}, got ${session.role}. Redirection requise.`);
                router.push("/role/welcompage/signe_in");
                return;
            }

            try {
                const res = await fetch("/api/auth/restore", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: session.userId }),
                });
                const data = await res.json();
                if (data.success) {
                    // Rafraîchit les server components avec les nouveaux cookies
                    router.refresh();
                }
            } catch {
                // Silencieux
            }
        };

        // Restaurer au montage
        restoreSession();

        // Restaurer quand l'onglet reprend le focus
        const onVisibility = () => {
            if (document.visibilityState === "visible") restoreSession();
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [expectedRole, router]);
}
