// Route API pour le tableau de bord de l'employé connecté.
// Expose une méthode GET qui retourne les données personnalisées du dashboard de l'employé.

import { getEmployeeDashboardData } from "@/backend/employee/dashboard";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/employeer/dashboard — Retourne les données du tableau de bord de l'employé connecté
export async function GET() {
  const employee = await requireRole(Role.EMPLOYEE);
  if (!employee) return unauthorized("Non authentifie.");

  // Charge les données du dashboard via la couche backend (planning, tâches, etc.)
  const data = await getEmployeeDashboardData(employee.id);
  if (!data) {
    // Retourne une erreur 500 si les données ne peuvent pas être chargées
    return Response.json({ success: false, error: "Impossible de charger le dashboard." }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
