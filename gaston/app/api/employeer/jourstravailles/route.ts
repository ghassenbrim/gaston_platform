import { getEmployeeWorkDays } from "@/backend/employee/jourstravailles";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const employee = await requireRole(Role.EMPLOYEE);
  if (!employee) return unauthorized("Non authentifie.");

  const workDays = await getEmployeeWorkDays(employee.id);
  return Response.json({ success: true, data: workDays });
}
