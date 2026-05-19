import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Liste des chemins publics accessibles sans authentification.
 * Ces routes correspondent aux pages d'accueil, de connexion et d'inscription.
 */
const PUBLIC_PATHS = [
  "/role/welcompage",
  "/role/welcompage/signe_in",
  "/role/welcompage/signe_up",
];

/**
 * Middleware Next.js exécuté à chaque requête correspondant au matcher.
 * Il gère la protection des routes selon le rôle de l'utilisateur connecté.
 *
 * Logique :
 * 1. Si la route est publique → laisser passer sans vérification.
 * 2. Si la route n'est pas une route protégée par rôle → laisser passer.
 * 3. Sinon, vérifier la présence et la validité des cookies d'authentification.
 * 4. Rediriger l'utilisateur vers la bonne route selon son rôle.
 */
export function middleware(request: NextRequest) {
  // Récupère le chemin de l'URL en cours de traitement
  const { pathname } = request.nextUrl;

  // Vérifie si le chemin demandé correspond à l'une des routes publiques
  const isPublicPath = PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

  // Si la route est publique, on laisse passer la requête sans contrôle
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Détermine si la route demandée est une route protégée par rôle
  const isProtectedRolePath =
    pathname.startsWith("/role/admin") ||
    pathname.startsWith("/role/user") ||
    pathname.startsWith("/role/employeer");

  // Si la route n'est pas protégée par un rôle, on laisse passer sans contrôle
  if (!isProtectedRolePath) {
    return NextResponse.next();
  }

  // Lecture des cookies d'authentification posés lors de la connexion
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  // Si l'identifiant utilisateur est absent, l'utilisateur n'est pas connecté → redirection vers la page de connexion
  if (!userId) {
    const loginUrl = new URL("/role/welcompage/signe_in", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier que le rôle correspond à la route accédée
  if (!userRole) {
    // Si le rôle est manquant, rediriger vers login
    const loginUrl = new URL("/role/welcompage/signe_in", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Déterminer la route appropriée selon le rôle
  // Table de correspondance entre les rôles et leurs routes dédiées
  const roleRouteMap: Record<string, string> = {
    "ADMIN": "/role/admin",
    "EMPLOYEE": "/role/employeer",
    "USER": "/role/user"
  };

  // Route de base autorisée pour le rôle de l'utilisateur connecté
  const allowedRoleRoute = roleRouteMap[userRole];

  // Vérifier si l'utilisateur essaie d'accéder une route qui ne correspond pas à son rôle
  // Si un non-ADMIN tente d'accéder à /role/admin, on le redirige vers sa propre section
  if (pathname.startsWith("/role/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL(allowedRoleRoute || "/role/user/dashboard", request.url));
  }
  // Si un non-EMPLOYEE tente d'accéder à /role/employeer, on le redirige vers sa propre section
  if (pathname.startsWith("/role/employeer") && userRole !== "EMPLOYEE") {
    return NextResponse.redirect(new URL(allowedRoleRoute || "/role/user/dashboard", request.url));
  }
  // Si un non-USER tente d'accéder à /role/user, on le redirige vers sa propre section
  if (pathname.startsWith("/role/user") && userRole !== "USER") {
    return NextResponse.redirect(new URL(allowedRoleRoute || "/role/user/dashboard", request.url));
  }

  // Toutes les vérifications sont passées : on autorise l'accès à la route demandée
  return NextResponse.next();
}

/**
 * Configuration du middleware : il s'applique uniquement aux routes commençant par /role/
 * Cela évite d'exécuter le middleware sur les assets statiques ou les API non concernées.
 */
export const config = {
  matcher: ["/role/:path*"],
};
