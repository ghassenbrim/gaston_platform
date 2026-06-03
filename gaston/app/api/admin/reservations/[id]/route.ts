import { deleteReservation, updateReservationStatus } from "@/backend/admin/reservations";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return unauthorized();

  const { id } = await context.params;
  const body = await request.json();
  const result = await updateReservationStatus(id, body.status, body.employeeIds, body.contractUrl);

  if (!result.success) {
    return Response.json(
      { success: false, error: result.error || "Impossible de mettre a jour la reservation." },
      { status: 400 }
    );
  }

  return Response.json({ success: true });
}

export async function DELETE(_request: Request, context: Context) {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return unauthorized();

  const { id } = await context.params;
  const result = await deleteReservation(id);

  if (!result.success) {
    return Response.json(
      { success: false, error: result.error || "Impossible de supprimer la reservation." },
      { status: 400 }
    );
  }

  return Response.json({ success: true });
}
