// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login as apiLogin } from "../hooks/api-user"; // ton service API
import { useAuth } from "../context/AuthProvider";
import type { LoginResponse as ApiLoginResponse } from "../hooks/api-user";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Wifi, AlertCircle } from "lucide-react";

// Interface pour TypeScript (role optionnel car différentes APIs renvoient des formats différents)
// Use the API response type (does not require a token for session-based auth)
type LoginResponse = ApiLoginResponse;

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const useAuthHook = useAuth();
  const location = useLocation();

  // helper pour extraire un role lisible depuis la réponse
  const extractRole = (u: any): string | undefined => {
    if (!u) return undefined;
    if (typeof u.role === "string" && u.role) return u.role;
    if (Array.isArray(u.roles) && u.roles.length) {
      // roles peut être ["admin"] ou [{name: "admin"}]
      const first = u.roles[0];
      if (typeof first === "string") return first;
      if (first && typeof first.name === "string") return first.name;
    }
    if (typeof u.is_admin === "boolean") return u.is_admin ? "admin" : "user";
    if (typeof u.role_name === "string") return u.role_name;
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use useAuth.login so the global auth state is updated
      const { login } = useAuthHook;
      const res = await login({ email, password });

      // Prefer the canonical user object from the auth provider (it should be set by login)
      const canonicalUser = useAuthHook.user ?? res?.user;
      const role = extractRole(canonicalUser);

      console.log("Utilisateur connecté via hook:", res.user);

      // If redirected here by ProtectedRoute, navigate back to the original location
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (role === "admin") {
        navigate("/");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Remplit simplement le formulaire; le login réel se fait via l'API
    setEmail("user1@example.com");
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wifi className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard IoT</h1>
          </div>
          <CardTitle className="text-center">Connexion</CardTitle>
          <p className="text-center text-muted-foreground">
            Connectez-vous à votre compte pour accéder au dashboard
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@exemple.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
