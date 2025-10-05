import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 px-6 py-10">
      {/* Bloc principal centré */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <div className="text-center p-8 bg-white shadow-md rounded-2xl max-w-md w-full border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-gray-800 mb-3">404</h1>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Page non trouvée
          </h2>
          <p className="text-gray-500 mb-6">
            Oups ! La page que vous recherchez semble introuvable ou n’existe
            plus.
          </p>

          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Retour à l’accueil
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer fixé en bas */}
      <footer className="text-sm text-gray-400 mt-10">
        &copy; {new Date().getFullYear()} Clinic Monitoring — Tous droits réservés
      </footer>
    </div>
  );
}
