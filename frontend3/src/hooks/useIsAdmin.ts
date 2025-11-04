import { useAuth } from '../context/AuthProvider';

/**
 * Hook pour détecter si l'utilisateur connecté est un administrateur
 * Utilise plusieurs heuristiques pour détecter le rôle admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userAny = user as any;
  const role = userAny?.role;
  const rolesArray = userAny?.roles;
  const isAdminFlag = userAny?.is_admin;
  
  // Vérification directe du rôle
  const isAdmin = (role === 'admin') || 
    (isAdminFlag === true) || 
    (Array.isArray(rolesArray) && rolesArray.includes('admin'));
  
  // Fallback pour le développement
  const emailIsAdminLike = typeof userAny?.email === 'string' && 
    userAny.email.toLowerCase().includes('admin');
  const idIsFirst = typeof userAny?.id === 'number' && userAny.id === 1;
  
  return isAdmin || emailIsAdminLike || idIsFirst;
}
