import { prisma } from "@/lib/prisma";
import type { Pack } from "@/lib/packs";

export interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  image: string;
}

export interface ServiceItem {
  title: string;
  description: string;
  price: string;
  packs?: Pack[];
}

export interface AboutContent {
  bio1: string;
  bio2: string;
  image: string;
  stats: { val: string; label: string }[];
}

export interface ContactContent {
  email: string;
  instagram: string;
  facebook: string;
  linkedin: string;
}

export interface HomepageData {
  portfolio: PortfolioItem[];
  services: ServiceItem[];
  about: AboutContent;
  contact: ContactContent;
}

const defaultPortfolio: PortfolioItem[] = [
  { id: 1, title: "Élégance Sylvestre", category: "Mariage", image: "/portfolio/portrait_1.png" },
  { id: 2, title: "Lignes de Béton", category: "Immobilier", image: "/portfolio/arch_1.png" },
  { id: 3, title: "La Chute Eternelle", category: "Anniversaire", image: "/portfolio/landscape_2.png" },
  { id: 4, title: "Souks de Marrakech", category: "Evenement", image: "/portfolio/reportage_1.png" },
];

const defaultServices: ServiceItem[] = [
  {
    title: "Portraits",
    description: "Séances portrait en studio ou en extérieur. Capturez votre personnalité avec des images naturelles et authentiques.",
    price: "À partir de 250 EUR",
  },
  {
    title: "Mariages",
    description: "Couverture complète de votre journée spéciale. Du matin jusqu'au soir, chaque émotion immortalisée.",
    price: "À partir de 1 500 EUR",
  },
  {
    title: "Architecture",
    description: "Photographie architecturale et immobilière. Mettez en valeur vos espaces avec un regard artistique.",
    price: "À partir de 400 EUR",
  },
  {
    title: "Reportage",
    description: "Couverture événementielle et documentaire. Racontez votre histoire à travers des images captivantes.",
    price: "À partir de 500 EUR",
  },
];

const defaultAbout: AboutContent = {
  bio1: "Depuis plus d'une décennie, je traque la lumière là où elle est la plus rare. Basé entre Paris et les contrées les plus lointaines, j'écris avec l'objectif des récits visuels qui défient le temps.",
  bio2: "Ma philosophie ? \"Moins est Plus\". Épurer l'image pour ne garder que l'émotion pure, le détail qui bouleverse et le silence qui parle au-delà des mots.",
  image: "/portfolio/photographer_portrait.png",
  stats: [
    { val: "12+", label: "Années d'Art" },
    { val: "500+", label: "Portfolios" },
    { val: "200+", label: "Regards Croisés" },
  ],
};

const defaultContact: ContactContent = {
  email: "art@ghassenbrahim.com",
  instagram: "#",
  facebook: "#",
  linkedin: "#",
};

export async function getHomepageContent(): Promise<HomepageData> {
  try {
    const row = await prisma.homepageContent.findUnique({ where: { id: "singleton" } });
    if (!row) {
      return {
        portfolio: defaultPortfolio,
        services: defaultServices,
        about: defaultAbout,
        contact: defaultContact,
      };
    }
    return {
      portfolio: Array.isArray(row.portfolio) ? (row.portfolio as unknown as PortfolioItem[]) : defaultPortfolio,
      services: Array.isArray(row.services) ? (row.services as unknown as ServiceItem[]) : defaultServices,
      about: typeof row.about === 'object' && row.about !== null ? (row.about as unknown as AboutContent) : defaultAbout,
      contact: typeof row.contact === 'object' && row.contact !== null ? (row.contact as unknown as ContactContent) : defaultContact,
    };
  } catch (error) {
    console.error("Erreur getHomepageContent:", error);
    return {
      portfolio: defaultPortfolio,
      services: defaultServices,
      about: defaultAbout,
      contact: defaultContact,
    };
  }
}

export async function updateHomepageContent(data: Partial<HomepageData>) {
  try {
    const current = await getHomepageContent();
    const updated = await prisma.homepageContent.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        portfolio: JSON.parse(JSON.stringify(data.portfolio ?? current.portfolio)),
        services: JSON.parse(JSON.stringify(data.services ?? current.services)),
        about: JSON.parse(JSON.stringify(data.about ?? current.about)),
        contact: JSON.parse(JSON.stringify(data.contact ?? current.contact)),
      },
      update: {
        ...(data.portfolio !== undefined && { portfolio: JSON.parse(JSON.stringify(data.portfolio)) }),
        ...(data.services !== undefined && { services: JSON.parse(JSON.stringify(data.services)) }),
        ...(data.about !== undefined && { about: JSON.parse(JSON.stringify(data.about)) }),
        ...(data.contact !== undefined && { contact: JSON.parse(JSON.stringify(data.contact)) }),
      },
    });
    return { success: true, data: updated };
  } catch (error) {
    console.error("Erreur updateHomepageContent:", error);
    return { success: false, error: "Impossible de sauvegarder le contenu." };
  }
}
