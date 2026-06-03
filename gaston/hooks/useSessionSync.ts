"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Verifie que la session signee par le serveur correspond au role attendu.
 */
export function useSessionSync(expectedRole: string) {
    const router = useRouter();

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const res = await fetch("/api/me", { cache: "no-store" });
                const data = await res.json();
                if (data.loggedIn && data.role === expectedRole) {
                    router.refresh();
                    return;
                }
                router.push("/role/welcompage/signe_in");
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
