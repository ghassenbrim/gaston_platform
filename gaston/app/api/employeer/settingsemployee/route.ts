import { getEmployeeProfile, updateEmployeeProfile, updateEmployeePassword } from "@/backend/employee/settingsemployee";
import { cookies } from "next/headers";

export async function GET() {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const profile = await getEmployeeProfile(userId);
  if (!profile) return Response.json({ success: false, error: "Profil non trouvé." }, { status: 404 });

  return Response.json({ success: true, data: profile });
}

export async function PATCH(request: Request) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const body = await request.json();

  if (body.type === "password") {
    if (!body.currentPassword || !body.newPassword) {
      return Response.json({ success: false, error: "Champs manquants." }, { status: 400 });
    }
    const result = await updateEmployeePassword(userId, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    return Response.json(result, { status: result.success ? 200 : 400 });
  }

  const result = await updateEmployeeProfile(userId, {
    firstName: body.firstName,
    lastName: body.lastName,
    position: body.position,
    phone: body.phone || undefined,
    age: body.age ? Number(body.age) : undefined,
    gender: body.gender || undefined,
  });

  return Response.json(result, { status: result.success ? 200 : 400 });
}
