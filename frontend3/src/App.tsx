import { useEffect } from "react";
import { Navbar } from "./components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { SensorManagement } from "./components/sensors/sensor-management";
import { CliniqueManagement } from "./components/cliniques/clinique-management";
import { AlertesManagement } from "./components/alertes/alertes-management";
import { UserManagement } from "./components/utilisateurs/utilisateur-management";
import { DashboardOverview } from './components/dashboard/dashboard-overview';
import useAuth from "./hooks/useAuth";
import { useNavigate } from "react-router-dom"; // <-- ajout

export default function App() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate(); // <-- ajout

  // Rediriger vers login si user devient null
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar 
        user={user || { email: "..." }} 
        onLogout={logout}  // logout déclenche la redirection via useEffect
        sensorsOnline={5} 
        totalSensors={10} 
      />

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex w-full justify-center gap-4 mb-50 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sensors">Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Cliniques</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DashboardOverview 
              sensors={[]} 
              alertes={[]} 
              onResolveAlert={() => {}} 
              onIgnoreAlert={() => {}} 
              onShowSensorEvolution={() => {}} 
            />
          </TabsContent>

          <TabsContent value="sensors" className="space-y-4">
            <SensorManagement />
          </TabsContent>

          <TabsContent value="cliniques" className="space-y-4">
            <CliniqueManagement />
          </TabsContent>

          <TabsContent value="alertes" className="space-y-4">
            <AlertesManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
