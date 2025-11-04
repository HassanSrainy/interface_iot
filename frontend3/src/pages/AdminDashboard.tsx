import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SensorManagement } from "../components/sensors/sensor-management";
import { CliniqueManagement } from "../components/cliniques/clinique-management";
import { AlertesManagement } from "../components/alertes/alertes-management";
import { UserManagement } from "../components/utilisateurs/utilisateur-management";
import { DashboardOverview } from "../components/dashboard/dashboard-overview";
import { Navbar } from "../components/layout/navbar";
import { useAuth } from "../context/AuthProvider";

export default function AdminDashboard(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={logout} />

      <main className="container mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex w-full justify-center gap-4 mb-6 rounded-xl bg-white shadow-sm border border-slate-200 p-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sensors">Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Cliniques</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DashboardOverview sensors={[]} alertes={[]} onResolveAlert={() => {}} onIgnoreAlert={() => {}} onShowSensorEvolution={() => {}} />
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
