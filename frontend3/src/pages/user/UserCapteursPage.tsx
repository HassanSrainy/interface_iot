import { useAuth } from "../../context/AuthProvider";
import UserNavbar from "../../components/layout/UserNavbar";
import { SensorManagement } from "../../components/sensors/sensor-management";

export default function UserCapteursPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <UserNavbar 
        user={user}
        onLogout={logout}
      />

      <main className="container mx-auto px-4 py-6 flex-1">
        <SensorManagement />
      </main>
    </div>
  );
}
