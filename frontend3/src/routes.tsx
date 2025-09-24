import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import {LoginPage} from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute element={<App />} />} /> {/* Dashboard protégé */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
