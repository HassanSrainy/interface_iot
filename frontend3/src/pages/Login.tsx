// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../hooks/api-user"; // ton service API
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Wifi, AlertCircle } from "lucide-react";

// Interface pour TypeScript (role optionnel car différentes APIs renvoient des formats différents)
interface LoginResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    // role peut être string, ou roles array, ou is_admin bool, etc.
    role?: string;
    roles?: string[] | { name?: string }[];
    is_admin?: boolean;
    [k: string]: any;
  };
  token: string;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const res: LoginResponse = await apiLogin({ email, password });

      // déterminer role de façon robuste
      const role = extractRole(res.user);

      // pour être sûr que localStorage contient toujours un champ role, on enrichit user si besoin
      const userToStore = { ...res.user, role };

      // Stockage
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("token", res.token);

      console.log("Utilisateur connecté :", userToStore);

      // Redirection selon le role
      if (role === "admin") {
        navigate("/"); // dashboard admin
      } else {
        // si role absent ou différent d'admin -> page utilisateur
        navigate("/user");
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

          <div className="mt-4 pt-4 border-t">
            <div className="text-center text-sm text-muted-foreground mb-3">
              <p>Compte de démonstration :</p>
              <p>Email: user1@example.com</p>
              <p>Mot de passe: password123</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Remplir automatiquement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
