import type { Config } from "tailwindcss";

/**
 * Configuration de Tailwind CSS pour le projet Gaston Platform.
 * Définit les fichiers analysés pour la purge des classes inutilisées,
 * ainsi que les extensions du thème par défaut (breakpoints, couleurs, typographie, animations).
 */
const config: Config = {
  /**
   * Chemins des fichiers sources analysés par Tailwind pour détecter les classes utilisées.
   * Seules les classes trouvées dans ces fichiers seront incluses dans le CSS final (tree-shaking).
   */
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      /**
       * Points de rupture (breakpoints) responsives personnalisés.
       * Tailwind adopte une approche "mobile-first" : chaque breakpoint s'applique
       * à partir de la largeur indiquée et au-delà.
       */
      screens: {
        // Mobile-first breakpoints (Tailwind default)
        xs: "320px",   // Extra small devices
        sm: "640px",   // Small devices (landscape)
        md: "768px",   // Tablets
        lg: "1024px",  // Large tablets / small laptops
        xl: "1280px",  // Laptops
        "2xl": "1536px", // Large screens
      },

      /**
       * Variables CSS personnalisées pour les couleurs du thème.
       * Ces valeurs sont définies dans les fichiers CSS globaux via :root {}
       * et permettent de supporter facilement un mode clair/sombre.
       */
      colors: {
        background: "var(--background)", // Couleur de fond principale de l'application
        foreground: "var(--foreground)", // Couleur du texte principal de l'application
      },

      /**
       * Tailles de police personnalisées avec leurs hauteurs de ligne associées.
       * Chaque entrée est un tuple [taille, { lineHeight }] pour un contrôle précis
       * de la lisibilité à chaque niveau typographique.
       */
      fontSize: {
        // Responsive font sizes
        "xs": ["0.75rem", { lineHeight: "1rem" }],       // Très petit texte (labels, badges)
        "sm": ["0.875rem", { lineHeight: "1.25rem" }],   // Texte secondaire
        "base": ["1rem", { lineHeight: "1.5rem" }],      // Taille de corps par défaut
        "lg": ["1.125rem", { lineHeight: "1.75rem" }],   // Texte légèrement agrandi
        "xl": ["1.25rem", { lineHeight: "1.75rem" }],    // Sous-titres
      },

      /**
       * Valeurs d'espacement personnalisées.
       * "safe" utilise CSS env() pour respecter les zones de sécurité des appareils
       * (ex: encoche iPhone), avec un minimum de 1rem.
       */
      spacing: {
        // Responsive spacing values
        "safe": "max(1rem, env(safe-area-inset-left))", // Marge sécurisée pour les encoches mobiles
      },

      /**
       * Animations personnalisées disponibles via la classe Tailwind animate-*.
       * "fade-in" permet un fondu d'apparition rapide et discret.
       */
      animation: {
        "fade-in": "fadeIn 0.3s ease-in", // Apparition progressive en 300ms
      },

      /**
       * Définition des images-clés (keyframes) utilisées par les animations ci-dessus.
       * fadeIn : transition de l'opacité 0 → 1 pour un effet d'apparition en fondu.
       */
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },   // Début : élément invisible
          "100%": { opacity: "1" }, // Fin : élément entièrement visible
        },
      },
    },
  },

  // Aucun plugin Tailwind tiers n'est activé pour le moment
  plugins: [],
};

export default config;
