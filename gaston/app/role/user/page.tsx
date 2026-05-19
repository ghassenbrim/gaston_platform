// Redirection automatique vers le tableau de bord utilisateur.
// Cette page racine n'affiche rien ; elle sert uniquement à rediriger
// l'utilisateur dès qu'il atteint /role/user.
import { redirect } from "next/navigation";

export default function UserRootPage() {
  // Redirige immédiatement vers le dashboard principal de l'espace client
  redirect("/role/user/dashboard");
}
