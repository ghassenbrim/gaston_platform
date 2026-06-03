import { getEmployeePayments } from "@/backend/employee/paiments";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const employee = await requireRole(Role.EMPLOYEE);
  if (!employee) return unauthorized("Non authentifie.");

  const payments = await getEmployeePayments(employee.id);
  return Response.json({ success: true, data: payments });
}
