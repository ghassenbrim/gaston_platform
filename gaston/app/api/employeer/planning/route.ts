// Route API pour récupérer le planning de l'employé connecté.
// Expose une méthode GET qui retourne les événements planifiés pour cet employé.

import { getEmployeePlanning } from "@/backend/employee/planning";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/employeer/planning — Retourne le planning de l'employé connecté
export async function GET() {
  const employee = await requireRole(Role.EMPLOYEE);
  if (!employee) return unauthorized("Non authentifie.");

  // Charge le planning via la couche backend et le retourne
  const planning = await getEmployeePlanning(employee.id);
  return Response.json({ success: true, data: planning });
}
