// Route API pour le tableau de bord de l'employé connecté.
// Expose une méthode GET qui retourne les données personnalisées du dashboard de l'employé.

import { getEmployeeDashboardData } from "@/backend/employee/dashboard";
import { cookies } from "next/headers";

// GET /api/employeer/dashboard — Retourne les données du tableau de bord de l'employé connecté
export async function GET() {
  // Récupère l'identifiant de l'employé depuis le cookie de session
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) {
    // Retourne une erreur 401 si l'employé n'est pas authentifié
    return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  // Charge les données du dashboard via la couche backend (planning, tâches, etc.)
  const data = await getEmployeeDashboardData(userId);
  if (!data) {
    // Retourne une erreur 500 si les données ne peuvent pas être chargées
    return Response.json({ success: false, error: "Impossible de charger le dashboard." }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
