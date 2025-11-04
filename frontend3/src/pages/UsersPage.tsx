import React from "react";
import { useAuth } from "../context/AuthProvider";
import { Navbar } from "../components/layout/navbar";
import { UserManagement } from "../components/utilisateurs/utilisateur-management";

export default function UsersPage(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={logout} />
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <UserManagement />
      </div>
    </div>
  );
}
