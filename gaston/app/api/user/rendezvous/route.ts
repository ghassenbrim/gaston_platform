// Route API pour la gestion des rendez-vous de l'utilisateur connecté.
// Expose deux méthodes : GET (récupérer les rendez-vous) et POST (créer un rendez-vous).

import { createRendezVous, getUserRendezVous } from "@/backend/user/rendezvous";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// GET /api/user/rendezvous — Récupère la liste des rendez-vous de l'utilisateur connecté
export async function GET() {
  // Récupère l'identifiant de l'utilisateur depuis le cookie de session
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) {
    // Retourne une erreur 401 si l'utilisateur n'est pas authentifié
    return Response.json({ success: false, error: "Non authentifie." }, { status: 401 });
  }

  // Recherche l'utilisateur en base de données pour obtenir son email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    // Retourne une erreur 404 si l'utilisateur est introuvable
    return Response.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
  }

  // Récupère les rendez-vous via la couche backend et les retourne
  const data = await getUserRendezVous(user.email);
  return Response.json({ success: true, data });
}

// POST /api/user/rendezvous — Crée un nouveau rendez-vous pour l'utilisateur connecté
export async function POST(request: Request) {
  // Récupère l'identifiant de l'utilisateur depuis le cookie de session
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) {
    return Response.json({ success: false, error: "Non authentifie." }, { status: 401 });
  }

  // Récupère le nom et l'email de l'utilisateur pour pré-remplir le rendez-vous
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user?.email) {
    return Response.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
  }

  // Lit les données du rendez-vous envoyées dans le corps de la requête
  const body = await request.json();

  // Crée le rendez-vous avec les informations du client et les détails du corps
  const result = await createRendezVous({
    clientName: user.name || "Client",
    clientEmail: user.email,
    service: body.service,
    date: new Date(body.date),
    time: body.time,
    location: body.location || "A preciser",
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    message: body.message,
  });

  if (!result.success) {
    // Retourne l'erreur métier si la création échoue
    return Response.json({ success: false, error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}
