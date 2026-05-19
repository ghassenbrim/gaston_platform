import { prisma } from "@/lib/prisma";
import { DEFAULT_QUOTE_CONFIG, normalizeQuoteConfig, type QuoteConfig } from "@/lib/quoteConfig";
import type { Prisma } from "@prisma/client";

export async function getQuoteConfig(): Promise<QuoteConfig> {
    try {
        const row = await prisma.quoteConfigContent.findUnique({
            where: { id: "singleton" },
        });

        return normalizeQuoteConfig(row?.config as Partial<QuoteConfig> | undefined);
    } catch (error) {
        console.error("Erreur getQuoteConfig:", error);
        return DEFAULT_QUOTE_CONFIG;
    }
}

export async function saveQuoteConfig(config: QuoteConfig) {
    try {
        const normalized = normalizeQuoteConfig(config);
        const jsonConfig = normalized as unknown as Prisma.InputJsonValue;
        const row = await prisma.quoteConfigContent.upsert({
            where: { id: "singleton" },
            update: { config: jsonConfig },
            create: { id: "singleton", config: jsonConfig },
        });

        return { success: true, config: normalizeQuoteConfig(row.config as Partial<QuoteConfig>) };
    } catch (error) {
        console.error("Erreur saveQuoteConfig:", error);
        return { success: false, error: "Impossible de sauvegarder la configuration." };
    }
}

export async function resetQuoteConfig() {
    return saveQuoteConfig(DEFAULT_QUOTE_CONFIG);
}
