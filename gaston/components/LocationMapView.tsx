"use client";

import { useEffect, useRef } from "react";

interface LocationMapViewProps {
    lat: number;
    lng: number;
    address?: string;
}

export default function LocationMapView({ lat, lng, address }: LocationMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<import("leaflet").Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        import("leaflet").then((L) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                keyboard: false,
                attributionControl: false,
            }).setView([lat, lng], 14);

            leafletMap.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(map);

            const marker = L.marker([lat, lng]).addTo(map);
            if (address) marker.bindPopup(address).openPopup();
        });

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={mapRef}
            className="w-full h-40 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10"
            style={{ zIndex: 0 }}
        />
    );
}
