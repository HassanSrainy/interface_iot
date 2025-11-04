import React from "react";
import DashboardOverview from "../components/dashboard/dashboard-overview";
import { Navbar } from "../components/layout/navbar";
import { useAuth } from "../context/AuthProvider";

export default function DashboardOverviewPage(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={logout} />
      <main className="container mx-auto px-4 sm:px-6 py-6">
        <DashboardOverview />
      </main>
    </div>
  );
}
