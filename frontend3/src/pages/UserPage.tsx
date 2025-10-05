// src/pages/UserPage.tsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import useAuth from "../hooks/useAuth";
import UserNavbar from "../components/layout/UserNavbar";


import { DashboardOverviewUser } from "../components/dashboard/dashboard-overview-user";
import { SensorManagementUser } from "../components/sensors/sensor-management-user";
import { CliniqueManagementUser } from "../components/cliniques/clinique-management-user";
import { AlertesManagementUser } from "../components/alertes/alertes-management-user";

/**
 * Page utilisateur (UI restreinte)
 * - utilise la UserNavbar
 * - n'affiche pas l'onglet "Utilisateurs"
 */
export default function UserPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // wrapper pour logout + redirection
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // si user devient null, redirect (sécurité)
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Navbar spécifique utilisateur */}
      <UserNavbar user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-6 flex-1">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex w-full justify-center gap-4 mb-6 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sensors">Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Cliniques</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
            {/* NOTE : pas d'onglet "users" pour les comptes non-admin */}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Passe les props nécessaires au composant user (adapter selon ta prop shape) */}
            <DashboardOverviewUser
              // si tu as besoin de props, ajoute-les ici ; sinon adapte le composant
              user={user}
            />
          </TabsContent>

          <TabsContent value="sensors" className="space-y-4">
            <SensorManagementUser  />
          </TabsContent>

          <TabsContent value="cliniques" className="space-y-4">
            <CliniqueManagementUser />
          </TabsContent>

          <TabsContent value="alertes" className="space-y-4">
            <AlertesManagementUser />
          </TabsContent>
        </Tabs>

    
      </main>
    </div>
  );
}
