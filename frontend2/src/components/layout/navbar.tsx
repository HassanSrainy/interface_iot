import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { LogOut, User, Bell, Wifi } from "lucide-react"

interface NavbarProps {
  user: { email: string }
  onLogout: () => void
  sensorsOnline: number
  totalSensors: number
}

export function Navbar({ user, onLogout, sensorsOnline, totalSensors }: NavbarProps) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-6 w-6 text-primary" />
              <h1 className="font-bold">Dashboard IoT</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              {sensorsOnline}/{totalSensors} capteurs en ligne
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}