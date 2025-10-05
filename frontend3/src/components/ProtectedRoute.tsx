// src/components/ProtectedRoute.tsx
import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ReservedForAdmin from "./ReservedForAdmin";

interface ProtectedRouteProps {
  element: ReactElement;
  allowedRoles?: string[]; // si omis => tout utilisateur authentifié peut accéder
}

export default function ProtectedRoute({ element, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // ou <Loader />

  // non authentifié -> login
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // récupération sûre du role
  const role = (user as any)?.role ?? (() => {
    try {
      const local = localStorage.getItem("user");
      if (!local) return undefined;
      return JSON.parse(local)?.role;
    } catch {
      return undefined;
    }
  })();

  // Si allowedRoles fourni et user n'a pas le role -> afficher message réservé
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <ReservedForAdmin />;
  }

  // Si allowedRoles fourni mais role non renseigné, on peut aussi décider d'afficher le message
  if (allowedRoles && !role) {
    // Par défaut on affiche message (sécurisé).
    return <ReservedForAdmin />;
  }

  // accès OK
  return element;
}
