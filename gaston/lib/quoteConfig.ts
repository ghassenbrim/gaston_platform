import { PACKS_BY_CATEGORY, type Pack } from "@/lib/packs";

export type PacksByCategory = Record<string, Pack[]>;

export interface ServicePrice {
    name: string;
    price: number;
}

export interface QuoteOption {
    id: string;
    label: string;
    price: number;
}

export interface PrintTier {
    id: string;
    label: string;
    min: number;
    max: number | null;
    unitPrice: number;
}

export interface QuoteConfig {
    packsByCategory: PacksByCategory;
    servicePrices: ServicePrice[];
    options: QuoteOption[];
    printTiers: PrintTier[];
}

export const QUOTE_CONFIG_STORAGE_KEY = "gaston_quote_config_v1";

export const DEFAULT_SERVICE_PRICES: ServicePrice[] = [
    { name: "Photos (numérique non limité)", price: 520 },
    { name: "Vidéo Continue", price: 460 },
    { name: "Clip Cinématique (Reel)", price: 320 },
    { name: "Drone", price: 320 },
    { name: "Girafe", price: 300 },
    { name: "Tirage 50 photos", price: 180 },
    { name: "Tirage 30 photos", price: 130 },
];

export const DEFAULT_QUOTE_OPTIONS: QuoteOption[] = [
    { id: "urgent", label: "Livraison express", price: 120 },
    { id: "travel", label: "Déplacement hors ville", price: 80 },
    { id: "album", label: "Album photo premium", price: 180 },
];

export const DEFAULT_PRINT_TIERS: PrintTier[] = [
    { id: "tier-1", label: "1 à 50 photos", min: 1, max: 50, unitPrice: 4.5 },
    { id: "tier-2", label: "51 à 99 photos", min: 51, max: 99, unitPrice: 4 },
    { id: "tier-3", label: "100 photos ou plus", min: 100, max: null, unitPrice: 3.5 },
];

export const DEFAULT_QUOTE_CONFIG: QuoteConfig = {
    packsByCategory: PACKS_BY_CATEGORY,
    servicePrices: DEFAULT_SERVICE_PRICES,
    options: DEFAULT_QUOTE_OPTIONS,
    printTiers: DEFAULT_PRINT_TIERS,
};

export function servicePriceMap(prices: ServicePrice[]) {
    return prices.reduce<Record<string, number>>((acc, service) => {
        acc[service.name] = service.price;
        return acc;
    }, {});
}

export function getPrintUnitPrice(photoCount: number, tiers: PrintTier[]) {
    const tier = tiers.find((item) =>
        photoCount >= item.min && (item.max === null || photoCount <= item.max),
    );

    return tier?.unitPrice ?? 0;
}

export function normalizeQuoteConfig(config: Partial<QuoteConfig> | null | undefined): QuoteConfig {
    return {
        packsByCategory: config?.packsByCategory ?? DEFAULT_QUOTE_CONFIG.packsByCategory,
        servicePrices: config?.servicePrices ?? DEFAULT_QUOTE_CONFIG.servicePrices,
        options: config?.options ?? DEFAULT_QUOTE_CONFIG.options,
        printTiers: config?.printTiers ?? DEFAULT_QUOTE_CONFIG.printTiers,
    };
}

export function loadQuoteConfigFromStorage(): QuoteConfig {
    if (typeof window === "undefined") return DEFAULT_QUOTE_CONFIG;

    try {
        const stored = window.localStorage.getItem(QUOTE_CONFIG_STORAGE_KEY);
        if (!stored) return DEFAULT_QUOTE_CONFIG;

        const parsed = JSON.parse(stored) as Partial<QuoteConfig>;

        return normalizeQuoteConfig(parsed);
    } catch {
        return DEFAULT_QUOTE_CONFIG;
    }
}
