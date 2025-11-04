// src/components/ReservedForAdmin.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function ReservedForAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Si l'utilisateur est connecté mais n'est pas admin, rediriger vers son espace
    if (user) {
      navigate("/user/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full p-6 border rounded-lg shadow bg-white text-center">
        <h2 className="text-2xl font-bold mb-2">Redirection...</h2>
        <p className="mb-4">Vous êtes redirigé vers votre espace.</p>
      </div>
    </div>
  );
}
