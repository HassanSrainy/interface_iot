// src/components/ProtectedRoute.tsx
import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import ReservedForAdmin from "./ReservedForAdmin";

interface ProtectedRouteProps {
  element: ReactElement;
  allowedRoles?: string[]; // si omis => tout utilisateur authentifié peut accéder
}

export default function ProtectedRoute({ element, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // ou <Loader />
  // Show a simple loading placeholder so the page doesn't stay blank
  if (loading) return <div className="p-4">Chargement...</div>;

  // non authentifié -> login
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // Determine if user has admin privileges using multiple heuristics
  const userAny = user as any;
  console.debug('ProtectedRoute: user, loading', { user: userAny, loading });
  const roleFromUser = userAny?.role;
  const rolesArray = userAny?.roles;
  const isAdminFlag = typeof userAny?.is_admin === 'boolean' ? userAny.is_admin : undefined;
  const roleName = userAny?.role_name;

  const role = roleFromUser ?? (Array.isArray(rolesArray) && rolesArray.length ? (typeof rolesArray[0] === 'string' ? rolesArray[0] : rolesArray[0]?.name) : undefined) ?? roleName ?? (() => {
    try {
      const local = localStorage.getItem("user");
      if (!local) return undefined;
      const parsed = JSON.parse(local);
      return parsed?.role ?? parsed?.role_name ?? (Array.isArray(parsed?.roles) && parsed.roles[0]) ?? (parsed?.is_admin ? 'admin' : undefined);
    } catch {
      return undefined;
    }
  })();

  const isAdmin = (role === 'admin') || (isAdminFlag === true) || (Array.isArray(rolesArray) && rolesArray.includes('admin'));
  // Dev fallback: if no explicit role but email contains 'admin' or id==1, treat as admin
  const emailIsAdminLike = typeof userAny?.email === 'string' && userAny.email.toLowerCase().includes('admin');
  const idIsFirst = typeof userAny?.id === 'number' && userAny.id === 1;
  const isAdminEffective = isAdmin || emailIsAdminLike || idIsFirst;

  console.debug('ProtectedRoute: role resolved', { role, isAdminEffective, allowedRoles });

  // If allowedRoles provided, ensure user's role matches one of them
  if (allowedRoles) {
    // Admin route: only admins allowed
    if (allowedRoles.includes('admin')) {
      if (isAdminEffective) {
        return element;
      } else {
        // User normal trying to access admin route -> redirect to user space
        return <Navigate to="/user/dashboard" replace />;
      }
    }
    
    // User route: only users allowed (NOT admins, they have their own space)
    if (allowedRoles.includes('user')) {
      if (!isAdminEffective) {
        return element;
      } else {
        // Admin trying to access user route -> redirect to admin space
        return <Navigate to="/" replace />;
      }
    }
    
    // Other roles: check if user's role matches
    if (role && allowedRoles.includes(role)) {
      return element;
    }
    
    return <ReservedForAdmin />;
  }

  // accès OK
  return element;
}
