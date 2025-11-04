import React from "react";
import CliniqueManagement from "../components/cliniques/clinique-management";
import { Navbar } from "../components/layout/navbar";
import { useAuth } from "../context/AuthProvider";

export default function CliniquesPage(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={logout} />
      <CliniqueManagement />
    </div>
  );
}
