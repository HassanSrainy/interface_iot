import { Routes, Route } from "react-router-dom";
import Users from "./pages/Users";
import Cliniques from "./pages/Cliniques";

export default function App() {
  return (
    <Routes>
      <Route path="/users" element={<Users />} />
      <Route path="/cliniques" element={<Cliniques />} />
    </Routes>
  );
}
