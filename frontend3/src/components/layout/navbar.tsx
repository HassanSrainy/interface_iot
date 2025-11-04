// frontend3/src/components/layout/navbar.tsx
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LogOut, BellRing, Menu, Wifi, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { User } from "../../hooks/api-user";
import { useSensors } from "../../queries/sensors";
import { useAlertesCounts } from "../../queries/alertes";
import { useMemo, useState } from "react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use React Query hooks
  const { data: sensors = [] } = useSensors();
  const { data: alertCounts } = useAlertesCounts();

  const sensorsOnline = sensors.filter((s: any) => s.status === "online").length;
  const totalActiveAlerts = useMemo(() => {
    if (!alertCounts) return 0;
    return Object.values(alertCounts).reduce((acc, entry) => {
      const raw = entry?.active_alertes;
      const value = typeof raw === "number" ? raw : Number(raw ?? 0);
      return acc + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [alertCounts]);

  const navLinks = user?.role === "admin" 
    ? [
        { to: "/", label: "Dashboard", end: true },
        { to: "/capteurs", label: "Capteurs" },
        { to: "/cliniques", label: "Cliniques" },
        { to: "/alertes", label: "Alertes" },
        { to: "/users", label: "Utilisateurs" },
      ]
    : [
        { to: "/user", label: "Mon Espace", end: true },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <Wifi className="h-6 w-6 text-blue-600" />
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-semibold text-slate-900">Centre de supervision</span>
                <span className="text-xs text-slate-500">IoT Monitoring</span>
              </div>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { borderBottom: '2px solid #000000' } : undefined
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Status Badge - Capteurs en ligne */}
            <div className="hidden md:flex items-center">
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-700">
                  <span className="text-green-600 font-bold">{sensorsOnline}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-600">{sensors.length}</span>
                  <span className="ml-1">en ligne</span>
                </span>
              </Badge>
            </div>

            {/* Notifications */}
            <NavLink to={user?.role === "admin" ? "/alertes" : "/user"}>
              <Button variant="ghost" size="sm" className="relative">
                <BellRing className="h-5 w-5" />
                {totalActiveAlerts > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '0 2px',
                      lineHeight: '1'
                    }}
                  >
                    {totalActiveAlerts > 99 ? '99+' : totalActiveAlerts}
                  </span>
                )}
              </Button>
            </NavLink>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                  {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                </div>
                <span className="text-xs text-slate-700 font-medium">
                  {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || "User"}
                </span>
              </div>

              <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Quitter</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-slate-900 border-l-2 border-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            
            <div className="pt-4 border-t space-y-2">
              <div className="px-4 py-2 text-sm">
                <p className="font-medium text-slate-900">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </p>
              </div>
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
