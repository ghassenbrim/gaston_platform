// Route API pour récupérer les réservations (côté administrateur).
// Expose une méthode GET qui supporte un filtre optionnel par statut.

import { getReservations } from "@/backend/admin/reservations";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/admin/reservations         → Retourne toutes les réservations
// GET /api/admin/reservations?status= → Filtre les réservations par statut (ex: "pending", "confirmed")
export async function GET(request: Request) {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return unauthorized();

  // Extrait le paramètre "status" de l'URL (facultatif)
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  // Charge les réservations avec le filtre optionnel et les retourne
  const reservations = await getReservations(status);
  return Response.json(reservations);
}
