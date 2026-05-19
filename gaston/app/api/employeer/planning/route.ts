// Route API pour récupérer le planning de l'employé connecté.
// Expose une méthode GET qui retourne les événements planifiés pour cet employé.

import { getEmployeePlanning } from "@/backend/employee/planning";
import { cookies } from "next/headers";

// GET /api/employeer/planning — Retourne le planning de l'employé connecté
export async function GET() {
  // Récupère l'identifiant de l'employé depuis le cookie de session
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) {
    // Retourne une erreur 401 si l'employé n'est pas authentifié
    return Response.json({ success: false, error: "Non authentifie." }, { status: 401 });
  }

  // Charge le planning via la couche backend et le retourne
  const planning = await getEmployeePlanning(userId);
  return Response.json({ success: true, data: planning });
}
