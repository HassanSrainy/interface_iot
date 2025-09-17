import { Navbar } from "./components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { SensorManagement } from "./components/sensors/sensor-management";
import { CliniqueManagement } from "./components/cliniques/clinique-management";
import { AlertesManagement } from "./components/alertes/alertes-management";


export default function App() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navbar */}
      <Navbar 
        user={{ email: "demo@iot-dashboard.com" }} 
        onLogout={() => {}}
        sensorsOnline={0}
        totalSensors={0}
      />

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="sensors" className="space-y-4">
          {/* Onglets */}
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="sensors">Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Cliniques</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
          </TabsList>

          {/* Contenus des onglets */}
          <TabsContent value="sensors" className="space-y-4">
            <SensorManagement />
          </TabsContent>

          <TabsContent value="cliniques" className="space-y-4">
            <CliniqueManagement />
          </TabsContent>

          <TabsContent value="alertes" className="space-y-4">
            <AlertesManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
