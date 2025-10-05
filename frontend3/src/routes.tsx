// src/routes.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import { LoginPage } from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import UserPage from "./pages/UserPage";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Dashboard — seulement admin */}
        <Route path="/" element={<ProtectedRoute element={<App />} allowedRoles={["admin"]} />} />

        {/* Page utilisateur — accessible si authentifié */}
        <Route path="/user" element={<ProtectedRoute element={<UserPage />} />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
