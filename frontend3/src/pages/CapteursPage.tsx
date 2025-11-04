import React from "react";
import SensorManagement from "../components/sensors/sensor-management";
import { Navbar } from "../components/layout/navbar";
import { useAuth } from "../context/AuthProvider";

export default function CapteursPage(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={logout} />
      <SensorManagement />
    </div>
  );
}
