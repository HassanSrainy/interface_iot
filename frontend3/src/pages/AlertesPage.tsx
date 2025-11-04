import React from "react";
import { AlertesManagement } from "../components/alertes/alertes-management";
import { Navbar } from "../components/layout/navbar";
import { useAuth } from "../context/AuthProvider";

export default function AlertesPage(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={logout} />
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <AlertesManagement />
      </div>
    </div>
  );
}
