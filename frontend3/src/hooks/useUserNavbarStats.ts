import { useState, useEffect, useRef } from "react";
import { getUserNavbarStats } from "../components/utilisateurs/utilisateurs-api";

export function useUserNavbarStats(userId: number | undefined) {
  const [sensorsCount, setSensorsCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const hasLoadedNavbarData = useRef(false);

  useEffect(() => {
    if (!userId || hasLoadedNavbarData.current) return;

    let mounted = true;
    hasLoadedNavbarData.current = true;

    const fetchNavbarStats = async () => {
      setLoading(true);
      try {
        const stats = await getUserNavbarStats(userId);

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
        if (mounted) setLoading(false);
      }
    };

    fetchNavbarStats();

    // Refresh périodique (toutes les 30s)
    const interval = setInterval(() => {
      if (!mounted) return;
      fetchNavbarStats();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  return { sensorsCount, onlineCount, alertsCount, loading };
}
