import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import useAuth from "../hooks/useAuth";
import UserNavbar from "../components/layout/UserNavbar";
import { DashboardOverviewUser } from "../components/dashboard/dashboard-overview-user";
import { SensorManagementUser } from "../components/sensors/sensor-management-user";
import { CliniqueManagementUser } from "../components/cliniques/clinique-management-user";
import { AlertesManagementUser } from "../components/alertes/alertes-management-user";
import { getUserNavbarStats } from "../components/utilisateurs/utilisateurs-api"; // ✅ Import de la nouvelle fonction

export default function UserPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ========================================
  // 📊 ÉTATS POUR LA NAVBAR
  // ========================================
  const [sensorsCount, setSensorsCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [navbarLoading, setNavbarLoading] = useState(true);

  // ========================================
  // 🔒 PROTECTION ANTI-DOUBLE-CHARGEMENT
  // ========================================
  const hasLoadedNavbarData = useRef(false);

  // ========================================
  // 📡 CHARGEMENT DES STATS NAVBAR (ultra-rapide)
  // ========================================
  useEffect(() => {
    if (!user?.id || hasLoadedNavbarData.current) return;

    let mounted = true;
    hasLoadedNavbarData.current = true;

    const fetchNavbarStats = async () => {
      setNavbarLoading(true);
      try {
        // ✅ Un seul appel API léger au lieu de 2 lourds !
        const stats = await getUserNavbarStats(user.id);

        if (!mounted) return;

        setSensorsCount(stats.sensors_count || 0);
        setOnlineCount(stats.online_count || 0);
        setAlertsCount(stats.alerts_count || 0);
      } catch (error) {
        console.error("Erreur lors du chargement des stats navbar :", error);
        setSensorsCount(0);
        setOnlineCount(0);
        setAlertsCount(0);
      } finally {
        if (mounted) setNavbarLoading(false);
      }
    };

    fetchNavbarStats();

    // ✅ Refresh périodique (toutes les 30s)
    const interval = setInterval(() => {
      if (!mounted) return;
      fetchNavbarStats();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // ========================================
  // 🚪 LOGOUT
  // ========================================
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // ========================================
  // 🔐 PROTECTION : Redirect si pas connecté
  // ========================================
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* ✅ Navbar avec données en props */}
      <UserNavbar 
        user={user}
        onLogout={handleLogout}
        sensorsCount={sensorsCount}
        onlineCount={onlineCount}
        alertsCount={alertsCount}
        loading={navbarLoading}
      />

      <main className="container mx-auto px-4 py-6 flex-1">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex w-full justify-center gap-4 mb-6 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sensors">Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Cliniques</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DashboardOverviewUser user={user} />
          </TabsContent>

          <TabsContent value="sensors" className="space-y-4">
            <SensorManagementUser />
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