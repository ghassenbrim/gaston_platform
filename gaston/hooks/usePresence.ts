"use client";

import { useEffect } from "react";

/**
 * Hook to automatically send presence heartbeats every 30 seconds.
 */
export function usePresence() {
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                await fetch("/api/presence", { method: "POST" });
            } catch (err) {
                console.error("Failed to send presence heartbeat:", err);
            }
        };

        // Send immediately on mount
        sendHeartbeat();

        // Send every 30 seconds
        const intervalId = setInterval(sendHeartbeat, 30_000);

        return () => clearInterval(intervalId);
    }, []);
}
