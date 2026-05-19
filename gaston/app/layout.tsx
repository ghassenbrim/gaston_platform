// Importation des types Next.js pour les métadonnées et la configuration du viewport
import type { Metadata, Viewport } from "next";
// Importation des polices Google Fonts via le système de polices de Next.js
import { Geist, Geist_Mono } from "next/font/google";
// Importation des styles CSS globaux de l'application
import "./globals.css";
// Importation du fournisseur de contexte de langue (gestion i18n côté client)
import { LanguageProviderClient } from "@/components/LanguageProviderClient";

/**
 * Configuration de la police sans-serif principale (Geist Sans).
 * La variable CSS "--font-geist-sans" sera utilisée dans les classes Tailwind.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Configuration de la police à chasse fixe (Geist Mono).
 * Utilisée pour l'affichage de code ou d'éléments monospace.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Configuration du viewport pour une expérience responsive et mobile optimale.
 * - themeColor : couleur de la barre de navigation sur mobile (beige/brun caractéristique Gaston)
 * - viewportFit "cover" : étend le contenu sous les encoches des appareils modernes (iPhone notch)
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 5.0,  // Permet le zoom jusqu'à 500% pour l'accessibilité
  userScalable: true,
  themeColor: "#bca086", // Couleur thème de la barre de statut mobile
  viewportFit: "cover",  // Couvre toute la surface de l'écran, y compris les zones safe area
};

/**
 * Métadonnées SEO et Open Graph de l'application.
 * Ces informations sont utilisées par les moteurs de recherche et les réseaux sociaux
 * lors du partage de liens vers la plateforme Gaston.
 */
export const metadata: Metadata = {
  title: "Gaston Platform",
  description: "Plateforme de gestion pour employés, administrateurs et utilisateurs",
  keywords: ["plateforme", "gestion", "employés", "réservations"],
  authors: [{ name: "Gaston Platform" }],
  creator: "Gaston Platform",
  openGraph: {
    type: "website",
    locale: "fr_FR",        // Métadonnée Open Graph indiquant la langue française
    url: "http://localhost:3000",
    siteName: "Gaston Platform",
  },
};

/**
 * Composant racine de l'application Next.js (Root Layout).
 * Enveloppe toutes les pages de l'application avec la structure HTML de base,
 * les polices, et le fournisseur de contexte de langue.
 *
 * @param children - Les pages et composants enfants à afficher dans le layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Langue définie sur "fr" pour l'accessibilité et le SEO
    // suppressHydrationWarning évite les avertissements liés aux différences de rendu SSR/CSR
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Encodage des caractères UTF-8 pour le support multilingue */}
        <meta charSet="utf-8" />
        {/* Désactive la détection automatique des numéros de téléphone sur iOS */}
        <meta name="format-detection" content="telephone=no" />
        {/* Permet à l'application de fonctionner en mode plein écran sur iOS (PWA) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Style de la barre de statut iOS : noir translucide pour s'intégrer au design */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Fournisseur de contexte de langue : wraps toutes les pages pour la gestion i18n */}
        <LanguageProviderClient>
          {children}
        </LanguageProviderClient>
      </body>
    </html>
  );
}
