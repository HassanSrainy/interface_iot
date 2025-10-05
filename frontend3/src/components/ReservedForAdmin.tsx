// src/components/ReservedForAdmin.tsx
import { Link } from "react-router-dom";

export default function ReservedForAdmin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full p-6 border rounded-lg shadow bg-white text-center">
        <h2 className="text-2xl font-bold mb-2">Espace réservé</h2>
        <p className="mb-4">Cette section est réservée aux administrateurs.</p>
        
      </div>
    </div>
  );
}
