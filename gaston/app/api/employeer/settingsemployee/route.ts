import { getEmployeeProfile, updateEmployeeProfile, updateEmployeePassword } from "@/backend/employee/settingsemployee";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const employee = await requireRole(Role.EMPLOYEE);
  if (!employee) return unauthorized("Non authentifie.");

  const profile = await getEmployeeProfile(employee.id);
  if (!profile) return Response.json({ success: false, error: "Profil non trouvé." }, { status: 404 });

  return Response.json({ success: true, data: profile });
}

export async function PATCH(request: Request) {
  const employee = await requireRole(Role.EMPLOYEE);
  if (!employee) return unauthorized("Non authentifie.");

  const body = await request.json();

  if (body.type === "password") {
    if (!body.currentPassword || !body.newPassword) {
      return Response.json({ success: false, error: "Champs manquants." }, { status: 400 });
    }
    const result = await updateEmployeePassword(employee.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    return Response.json(result, { status: result.success ? 200 : 400 });
  }

  const result = await updateEmployeeProfile(employee.id, {
    firstName: body.firstName,
    lastName: body.lastName,
    position: body.position,
    phone: body.phone || undefined,
    age: body.age ? Number(body.age) : undefined,
    gender: body.gender || undefined,
  });

  return Response.json(result, { status: result.success ? 200 : 400 });
}
