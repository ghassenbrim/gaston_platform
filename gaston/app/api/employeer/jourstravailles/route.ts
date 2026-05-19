import { getEmployeeWorkDays } from "@/backend/employee/jourstravailles";
import { cookies } from "next/headers";

export async function GET() {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) {
    return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  const workDays = await getEmployeeWorkDays(userId);
  return Response.json({ success: true, data: workDays });
}
