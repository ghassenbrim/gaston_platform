"use client";

import { useEffect, useRef, useState } from "react";

interface LocationPickerProps {
    value: string;
    lat: number | null;
    lng: number | null;
    onChange: (address: string, lat: number, lng: number) => void;
}

export default function LocationPicker({ value, lat, lng, onChange }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<import("leaflet").Map | null>(null);
    const markerRef = useRef<import("leaflet").Marker | null>(null);
    const [search, setSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Inject Leaflet CSS once
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        import("leaflet").then((L) => {
            // Fix default marker icons for Next.js/webpack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const initialLat = lat ?? 36.8065;
            const initialLng = lng ?? 10.1815;
            const initialZoom = lat ? 14 : 6;

            const map = L.map(mapRef.current!, { zoomControl: true }).setView(
                [initialLat, initialLng],
                initialZoom
            );
            leafletMap.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            if (lat && lng) {
                const marker = L.marker([lat, lng]).addTo(map);
                markerRef.current = marker;
            }

            map.on("click", async (e) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;

                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng]);
                } else {
                    markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
                }

                // Reverse geocode via Nominatim
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${clickLat}&lon=${clickLng}&format=json`,
                        { headers: { "Accept-Language": "fr" } }
                    );
                    const data = await res.json();
                    const address = data.display_name ?? `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`;
                    onChange(address, clickLat, clickLng);
                } catch {
                    onChange(`${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`, clickLat, clickLng);
                }
            });
        });

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external lat/lng changes (e.g. search result) to map
    useEffect(() => {
        if (!leafletMap.current || !lat || !lng) return;
        import("leaflet").then((L) => {
            leafletMap.current!.setView([lat, lng], 14, { animate: true });
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(leafletMap.current!);
            }
        });
    }, [lat, lng]);

    const handleSearchInput = (val: string) => {
        setSearch(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&accept-language=fr`
                );
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 400);
    };

    const selectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
        const lat = parseFloat(s.lat);
        const lng = parseFloat(s.lon);
        onChange(s.display_name, lat, lng);
        setSearch("");
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
                <div className="relative flex items-center">
                    <svg className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Rechercher un lieu..."
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-[#bca086] rounded-2xl outline-none transition-all dark:text-white text-sm placeholder:text-slate-400"
                    />
                    {searching && (
                        <svg className="absolute right-4 w-4 h-4 text-[#bca086] animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onMouseDown={() => selectSuggestion(s)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-[#bca086]/10 hover:text-[#bca086] transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                            >
                                <span className="line-clamp-2">{s.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map */}
            <div
                ref={mapRef}
                className="w-full h-64 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-white/10 shadow-sm"
                style={{ zIndex: 0 }}
            />

            {/* Selected location display */}
            {value && (
                <div className="flex items-start gap-3 p-3 bg-[#bca086]/10 border border-[#bca086]/20 rounded-2xl">
                    <svg className="w-4 h-4 text-[#bca086] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-[#bca086] font-medium leading-relaxed">{value}</p>
                </div>
            )}

            <p className="text-[10px] text-slate-400 ml-1">Cliquez sur la carte ou recherchez un lieu pour définir l&apos;emplacement de la séance.</p>
        </div>
    );
}
