// Route API pour la gestion des employés par l'administrateur.
// Expose deux méthodes : GET (liste des employés) et POST (créer un employé).

import { getEmployees } from "@/backend/admin/employes";
import { createEmployee } from "@/backend/admin/employes";

// GET /api/admin/employes — Retourne la liste de tous les employés de la plateforme
export async function GET() {
  const employees = await getEmployees();
  return Response.json(employees);
}

// POST /api/admin/employes — Crée un nouvel employé avec les informations fournies
export async function POST(request: Request) {
  try {
    // Lit le corps de la requête contenant les informations du nouvel employé
    const body = await request.json();

    // Appelle la logique métier de création avec les champs obligatoires
    const result = await createEmployee({
      prenom: body.prenom,     // Prénom de l'employé
      nom: body.nom,           // Nom de famille
      email: body.email,       // Adresse email (utilisée pour la connexion)
      phone: body.phone,       // Numéro de téléphone
      password: body.password, // Mot de passe (sera hashé dans la couche backend)
      role: body.role,         // Rôle attribué (ex: EMPLOYEE)
    });

    if (!result.success) {
      // Retourne l'erreur métier si la création échoue (ex: email déjà utilisé)
      return Response.json(
        { success: false, error: result.error || "Impossible de creer l'employe." },
        { status: 400 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    // Capture les erreurs inattendues du serveur et les journalise
    console.error("Erreur API creation employe:", error);
    return Response.json(
      { success: false, error: "Erreur serveur lors de la creation de l'employe." },
      { status: 500 }
    );
  }
}
