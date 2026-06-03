// Route API pour la gestion de la liste des utilisateurs par l'administrateur.
// Expose deux méthodes : GET (liste de tous les utilisateurs) et DELETE (supprimer un utilisateur).

import { getAllUsers, deleteUser } from "@/backend/admin/listuser";
import { requireRole, unauthorized } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/admin/listuser — Retourne la liste complète de tous les utilisateurs de la plateforme
export async function GET() {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return unauthorized();

  const users = await getAllUsers();
  return Response.json(users);
}

// DELETE /api/admin/listuser — Supprime un utilisateur par son identifiant
// Corps attendu : { id: string }
export async function DELETE(request: Request) {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return unauthorized();

  // Extrait l'identifiant de l'utilisateur à supprimer depuis le corps de la requête
  const { id } = await request.json();

  // Vérifie que l'identifiant est bien fourni
  if (!id) return Response.json({ success: false, error: "ID manquant." }, { status: 400 });

  // Appelle la logique de suppression et retourne le résultat
  // Le statut HTTP reflète le succès ou l'échec de l'opération
  const result = await deleteUser(id);
  return Response.json(result, { status: result.success ? 200 : 500 });
}
