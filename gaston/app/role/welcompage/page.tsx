import { getHomepageContent } from "@/backend/admin/homepage";
import WelcomePageClient from "./WelcomePageClient";
import { getMinPriceLabel, getPacksForEventType } from "@/lib/packs";

export const dynamic = "force-dynamic";

// Correspondance entre le titre du service (défini par l'admin) et la catégorie de réservation
const SERVICE_CATEGORY_MAP: Record<string, string> = {
    "Portraits":      "Anniversaire",
    "Mariages":       "Mariage",
    "Architecture":   "Immobilier",
    "Reportage":      "Evenement",
};

import { prisma } from "@/lib/prisma";

export default async function WelcomePage() {
    const data = await getHomepageContent();

    // Remplace le prix de chaque service par le prix min du pack correspondant et ajoute les packs
    const services = data.services.map(service => {
        const category = SERVICE_CATEGORY_MAP[service.title];
        const minPrice = category ? getMinPriceLabel(category) : "";
        const packs = category ? getPacksForEventType(category) : [];
        return { ...service, price: minPrice || service.price, packs };
    });

    // Fetch approved reviews
    const reviews = await prisma.review.findMany({
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 12, // Augmenté pour le scroll horizontal
    });

    return (
        <WelcomePageClient
            portfolio={data.portfolio}
            services={services}
            about={data.about}
            contact={data.contact}
            reviews={reviews}
        />
    );
}
