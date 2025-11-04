import { useAuth } from "../../context/AuthProvider";
import UserNavbar from "../../components/layout/UserNavbar";
import { DashboardOverview } from "../../components/dashboard/dashboard-overview";

export default function UserDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <UserNavbar 
        user={user}
        onLogout={logout}
      />

      <main className="container mx-auto px-4 py-6 flex-1">
        <DashboardOverview />
      </main>
    </div>
  );
}
