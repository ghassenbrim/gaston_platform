/**
 * Interface décrivant la structure d'un pack de services photographiques.
 *
 * @property name       - Nom du pack (ex: "Pack 1", "Pack 2")
 * @property price      - Prix affiché sous forme de chaîne (ex: "900 DT")
 * @property priceValue - Prix numérique utilisé pour les calculs et comparaisons
 * @property features   - Liste des prestations incluses dans ce pack
 */
export interface Pack {
    name: string;
    price: string;
    priceValue: number;
    features: string[];
}

/**
 * Catalogue complet des packs disponibles, organisé par catégorie d'événement.
 *
 * Chaque catégorie propose 3 niveaux de packs (Basic → Premium) avec des
 * prestations et tarifs croissants. Les catégories disponibles sont :
 * - Mariage    : cérémonies de mariage (900, 1100, 1600 DT)
 * - Evenement  : événements généraux (900, 1100, 1600 DT)
 * - Autre      : autres types d'événements (900, 1100, 1600 DT)
 * - Anniversaire: fêtes d'anniversaire (400, 600, 750 DT)
 * - Immobilier : reportages immobiliers (400, 600, 700 DT)
 */
export const PACKS_BY_CATEGORY: Record<string, Pack[]> = {
    Mariage: [
        { name: "Pack 1", price: "900 DT", priceValue: 900, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)"] },
        { name: "Pack 2", price: "1100 DT", priceValue: 1100, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Drone"] },
        { name: "Pack 3", price: "1600 DT", priceValue: 1600, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Drone", "Girafe"] },
    ],
    Evenement: [
        { name: "Pack 1", price: "900 DT", priceValue: 900, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)"] },
        { name: "Pack 2", price: "1100 DT", priceValue: 1100, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Drone"] },
        { name: "Pack 3", price: "1600 DT", priceValue: 1600, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Drone", "Girafe"] },
    ],
    Autre: [
        { name: "Pack 1", price: "900 DT", priceValue: 900, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)"] },
        { name: "Pack 2", price: "1100 DT", priceValue: 1100, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Drone"] },
        { name: "Pack 3", price: "1600 DT", priceValue: 1600, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Drone", "Girafe"] },
    ],
    Anniversaire: [
        { name: "Pack 1", price: "400 DT", priceValue: 400, features: ["Photos (numérique non limité)", "Clip Cinématique (Reel)"] },
        { name: "Pack 2", price: "600 DT", priceValue: 600, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)"] },
        { name: "Pack 3", price: "750 DT", priceValue: 750, features: ["Photos (numérique non limité)", "Vidéo Continue", "Clip Cinématique (Reel)", "Tirage 50 photos"] },
    ],
    Immobilier: [
        { name: "Pack 1", price: "400 DT", priceValue: 400, features: ["Photos (numérique non limité)", "Clip Cinématique (Reel)"] },
        { name: "Pack 2", price: "600 DT", priceValue: 600, features: ["Photos (numérique non limité)", "Clip Cinématique (Reel)", "Drone"] },
        { name: "Pack 3", price: "700 DT", priceValue: 700, features: ["Photos (numérique non limité)", "Clip Cinématique (Reel)", "Tirage 30 photos", "Drone"] },
    ],
};

/**
 * Retourne la liste des packs disponibles pour un type d'événement donné.
 * Si la catégorie n'existe pas dans le catalogue, retourne un tableau vide.
 *
 * @param type - Nom de la catégorie d'événement (ex: "Mariage", "Anniversaire")
 * @returns    - Tableau de packs correspondant à la catégorie, ou [] si introuvable
 */
export function getPacksForEventType(type: string): Pack[] {
    return PACKS_BY_CATEGORY[type] ?? [];
}

/** Retourne le prix minimum d'une catégorie, ex: "À partir de 900 DT" */
/**
 * Calcule et retourne le libellé du prix de départ pour une catégorie donnée.
 * Utile pour afficher une accroche tarifaire sur les pages de présentation.
 *
 * @param category - Nom de la catégorie d'événement (ex: "Immobilier")
 * @returns          Une chaîne du type "À partir de X DT", ou "" si la catégorie est vide
 */
export function getMinPriceLabel(category: string): string {
    const packs = PACKS_BY_CATEGORY[category];
    // Si la catégorie n'existe pas ou ne contient aucun pack, on retourne une chaîne vide
    if (!packs || packs.length === 0) return "";
    // Extraction du prix minimal parmi tous les packs de la catégorie
    const min = Math.min(...packs.map(p => p.priceValue));
    return `À partir de ${min} DT`;
}
