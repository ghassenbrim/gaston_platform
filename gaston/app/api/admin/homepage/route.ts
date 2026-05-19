// Route API pour la gestion du contenu de la page d'accueil par l'administrateur.
// Expose deux méthodes : GET (lire le contenu) et PUT (mettre à jour le contenu).

import { getHomepageContent, updateHomepageContent } from "@/backend/admin/homepage";

// GET /api/admin/homepage — Retourne le contenu actuel de la page d'accueil
// (portfolio, services, section À propos, informations de contact)
export async function GET() {
  const data = await getHomepageContent();
  return Response.json(data);
}

// PUT /api/admin/homepage — Met à jour le contenu de la page d'accueil
// Corps attendu : objet contenant les sections à mettre à jour
export async function PUT(request: Request) {
  // Lit le corps de la requête contenant les nouvelles valeurs
  const body = await request.json();

  // Appelle la logique de mise à jour et retourne le résultat
  // Le statut HTTP reflète le succès (200) ou l'échec (500) de l'opération
  const result = await updateHomepageContent(body);
  return Response.json(result, { status: result.success ? 200 : 500 });
}
