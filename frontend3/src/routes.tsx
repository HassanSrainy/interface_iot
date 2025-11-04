// src/routes.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardOverviewPage from "./pages/DashboardOverviewPage";
import CapteursPage from "./pages/CapteursPage";
import CliniquesPage from "./pages/CliniquesPage";
import AlertesPage from "./pages/AlertesPage";
import UsersPage from "./pages/UsersPage";
import { LoginPage } from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthProvider";
import UserDashboardPage from "./pages/user/UserDashboardPage";
import UserCapteursPage from "./pages/user/UserCapteursPage";
import UserCliniquesPage from "./pages/user/UserCliniquesPage";
import UserAlertesPage from "./pages/user/UserAlertesPage";
import DebugAuth from "./pages/DebugAuth";

export default function AppRoutes() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
  {/* ========================================
      ADMIN ROUTES
      ======================================== */}
  
  {/* Dashboard overview (separated page) — only admin */}
  <Route path="/" element={<ProtectedRoute element={<DashboardOverviewPage />} allowedRoles={["admin"]} />} />

  {/* Capteurs management — isolated page */}
  <Route path="/capteurs" element={<ProtectedRoute element={<CapteursPage />} allowedRoles={["admin"]} />} />

  {/* Cliniques management */}
  <Route path="/cliniques" element={<ProtectedRoute element={<CliniquesPage />} allowedRoles={["admin"]} />} />

  {/* Alertes management */}
  <Route path="/alertes" element={<ProtectedRoute element={<AlertesPage />} allowedRoles={["admin"]} />} />

  {/* Utilisateurs management */}
  <Route path="/users" element={<ProtectedRoute element={<UsersPage />} allowedRoles={["admin"]} />} />

  {/* ========================================
      USER ROUTES
      ======================================== */}
  
  {/* Redirect /user to /user/dashboard */}
  <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
  
  {/* User Dashboard */}
  <Route path="/user/dashboard" element={<ProtectedRoute element={<UserDashboardPage />} allowedRoles={["user"]} />} />
  
  {/* User Capteurs */}
  <Route path="/user/capteurs" element={<ProtectedRoute element={<UserCapteursPage />} allowedRoles={["user"]} />} />
  
  {/* User Cliniques */}
  <Route path="/user/cliniques" element={<ProtectedRoute element={<UserCliniquesPage />} allowedRoles={["user"]} />} />
  
  {/* User Alertes */}
  <Route path="/user/alertes" element={<ProtectedRoute element={<UserAlertesPage />} allowedRoles={["user"]} />} />

  {/* ========================================
      PUBLIC / DEBUG ROUTES
      ======================================== */}
  
  <Route path="/login" element={<LoginPage />} />
  <Route path="/debug-auth" element={<ProtectedRoute element={<DebugAuth />} />} />
  <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
