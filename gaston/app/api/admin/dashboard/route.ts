// Route API pour le tableau de bord de l'administrateur.
// Expose une méthode GET qui retourne les statistiques globales et l'activité récente en parallèle.

import { getDashboardStats, getRecentActivity } from "@/backend/admin/dashboard";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/admin/dashboard — Retourne les données du tableau de bord administrateur
export async function GET() {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return unauthorized();

  // Exécute les deux requêtes en parallèle pour optimiser les performances
  // - getDashboardStats : nombre d'utilisateurs, de rendez-vous, etc.
  // - getRecentActivity : dernières actions ou événements sur la plateforme
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  // Retourne les statistiques et l'activité regroupées dans une seule réponse
  return Response.json({ stats, activity });
}
