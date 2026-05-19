import { getEmployeePayments } from "@/backend/employee/paiments";
import { cookies } from "next/headers";

export async function GET() {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) {
    return Response.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  const payments = await getEmployeePayments(userId);
  return Response.json({ success: true, data: payments });
}
