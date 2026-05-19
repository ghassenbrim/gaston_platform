import type { NextConfig } from "next";

/**
 * Configuration principale de l'application Next.js.
 * Regroupe les paramètres d'optimisation des images et les règles de réécriture d'URLs.
 */
const nextConfig: NextConfig = {
  /**
   * Configuration du composant <Image> de Next.js pour l'optimisation automatique des images.
   */
  images: {
    // Formats modernes supportés : AVIF (meilleure compression) et WebP (large compatibilité)
    formats: ["image/avif", "image/webp"],

    // Niveaux de qualité proposés lors de la génération des variantes d'images optimisées
    qualities: [75, 80, 85],

    // Largeurs de rendu pour les images pleine largeur (correspond aux breakpoints courants)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],

    // Tailles fixes pour les images dans des conteneurs de taille déterminée (icônes, vignettes)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Durée minimale de mise en cache des images optimisées : 30 jours (en secondes)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    /**
     * Domaines distants autorisés pour le chargement d'images externes.
     * Les images provenant d'autres domaines seront refusées par Next.js pour des raisons de sécurité.
     */
    remotePatterns: [
      {
        // Autorise toutes les images hébergées sur les sous-domaines Supabase (.supabase.co)
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        // Autorise également le domaine principal Supabase (.supabase.com)
        protocol: "https",
        hostname: "**.supabase.com",
      },
      {
        // Autorise les images servies localement en développement (localhost:3000)
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
    ],
  },

  /**
   * Règles de réécriture d'URLs (rewrites) : redirigent silencieusement les requêtes
   * vers une autre route interne sans que l'URL visible dans le navigateur ne change.
   * Utile pour proposer des URLs simplifiées tout en conservant la structure de fichiers existante.
   */
  async rewrites() {
    return [
      {
        // L'URL /admin/user pointe vers la page de liste des utilisateurs dans l'espace admin
        source: "/admin/user",
        destination: "/role/admin/listuser",
      },
      {
        // L'URL /admin/employeer pointe vers la page de gestion des employés dans l'espace admin
        source: "/admin/employeer",
        destination: "/role/admin/employes",
      },
      {
        // Toute autre URL /admin/... est réécrite vers son équivalent dans /role/admin/...
        source: "/admin/:path*",
        destination: "/role/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
