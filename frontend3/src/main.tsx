import { createRoot } from "react-dom/client";
import 'react-datepicker/dist/react-datepicker.css';
import AppRoutes from "./routes";
import "./index.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes - les données restent fraîches plus longtemps
			gcTime: 10 * 60 * 1000, // 10 minutes - garde en mémoire après inutilisé
			retry: 1,
			refetchOnWindowFocus: false, // Ne recharge pas au focus de la fenêtre
			refetchOnMount: false, // Utilise le cache si disponible au montage
			refetchOnReconnect: true, // Recharge seulement à la reconnexion
		},
	},
});

createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={queryClient}>
		<AppRoutes />
	</QueryClientProvider>
);
