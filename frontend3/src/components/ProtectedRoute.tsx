// src/components/ProtectedRoute.tsx
import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

interface ProtectedRouteProps {
  element: ReactElement;
}

export default function ProtectedRoute({ element }: ProtectedRouteProps) {
  const { user } = useAuth();

  // Redirige directement si pas de user
  if (!user) return <Navigate to="/login" replace />;

  return element;
}
