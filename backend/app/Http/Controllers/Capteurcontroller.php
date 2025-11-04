<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Capteur;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CapteurController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Récupérer tous les capteurs avec leur famille, service, mesures et alertes
        $capteurs = Capteur::with(['famille.type', 'service.floor.clinique', 'alertes','derniereMesure'])->get();
        return response()->json($capteurs);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validation des données
        $validated = $request->validate([
            'famille_id' => 'required|exists:familles,id',
            'service_id' => 'required|exists:services,id',
            'matricule' => 'required|string|unique:capteurs',
            'date_installation' => 'nullable|date',
            'date_derniere_connexion' => 'nullable|date',
            'date_derniere_deconnexion' => 'nullable|date',
            'seuil_min' => 'nullable|numeric',
            'seuil_max' => 'nullable|numeric',
            'adresse_ip' => 'nullable|ip',
            'unite' => 'nullable|string|max:20',
            // Regex MAC: accepte XX:XX:XX:XX:XX:XX ou XX-XX-... ou XXXXXXXXXXXX
            'adresse_mac' => ['nullable', 'regex:/^([0-9A-Fa-f]{2}([:-]?)){5}[0-9A-Fa-f]{2}$/'],
        ]);

        try {
            $capteur = Capteur::create($validated);
        } catch (\Throwable $e) {
            Log::error('Capteur::store failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'validated' => $validated,
            ]);
            return response()->json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
        }

        return response()->json($capteur, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $capteur = Capteur::with(['famille.type', 'service', 'mesures', 'alertes'])->find($id);

        if (!$capteur) {
            return response()->json(['message' => 'Capteur non trouvé'], 404);
        }

        return response()->json($capteur);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $capteur = Capteur::find($id);

        if (!$capteur) {
            return response()->json(['message' => 'Capteur non trouvé'], 404);
        }

        $validated = $request->validate([
            'famille_id' => 'sometimes|exists:familles,id',
            'service_id' => 'sometimes|exists:services,id',
            // allow same matricule for the current capteur
            'matricule' => 'sometimes|string|unique:capteurs,matricule,' . $id,
            'date_installation' => 'nullable|date',
            'date_derniere_connexion' => 'nullable|date',
            'date_derniere_deconnexion' => 'nullable|date',
            'seuil_min' => 'nullable|numeric',
            'seuil_max' => 'nullable|numeric',
            'adresse_ip' => 'nullable|ip',
            'unite' => 'nullable|string|max:20',
            'adresse_mac' => ['nullable', 'regex:/^([0-9A-Fa-f]{2}([:-]?)){5}[0-9A-Fa-f]{2}$/'],
        ]);

        try {
            $capteur->update($validated);
        } catch (\Throwable $e) {
            Log::error('Capteur::update failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'validated' => $validated,
                'capteur_id' => $id,
            ]);
            return response()->json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
        }

        return response()->json($capteur);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $capteur = Capteur::find($id);

        if (!$capteur) {
            return response()->json(['message' => 'Capteur non trouvé'], 404);
        }

        $capteur->delete();

        return response()->json(['message' => 'Capteur supprimé avec succès']);
    }
    /**
 * Retourne le nombre total et actif d'alertes pour un capteur donné
 */
public function alertesCount(string $id)
{
    $capteur = Capteur::withCount([
        'alertes', // total
        'alertes as alertes_actives_count' => function ($query) {
            $query->where('statut', 'actif');
        }
    ])->find($id);

    if (!$capteur) {
        return response()->json(['message' => 'Capteur non trouvé'], 404);
    }

    return response()->json([
        'capteur_id' => $capteur->id,
        'total_alertes' => $capteur->alertes_count,
        'active_alertes' => $capteur->alertes_actives_count,
    ]);
}
// app/Http/Controllers/CapteurController.php

/**
 * Retourne le nombre d'alertes (total + actives) pour tous les capteurs
 * Ou filtré par IDs si fournis en query string
 */
public function alertesCountBatch(Request $request)
{
    $capteurIds = $request->query('ids'); // ex: ?ids=1,2,3,4
    
    $query = Capteur::withCount([
        'alertes as total_alertes',
        'alertes as alertes_actives' => function ($q) {
            $q->where('statut', 'actif');
        }
    ]);

    // Si des IDs sont fournis, filtrer
    if ($capteurIds) {
        $ids = explode(',', $capteurIds);
        $query->whereIn('id', $ids);
    }

    $capteurs = $query->get(['id', 'alertes_count', 'alertes_actives_count']);

    // Reformater en objet simple : { capteur_id: { total, active } }
    $result = [];
    foreach ($capteurs as $capteur) {
        $result[$capteur->id] = [
            'total_alertes' => $capteur->total_alertes ?? 0,
            'active_alertes' => $capteur->alertes_actives ?? 0,
        ];
    }

    return response()->json($result);
}
public function mesures(Request $request, string $id)
{
    $capteur = Capteur::find($id);
    
    if (!$capteur) {
        return response()->json(['message' => 'Capteur non trouvé'], 404);
    }
    
    // Récupérer les mesures avec filtres optionnels
    $query = $capteur->mesures();
    
    // Filtre par période (optionnel)
    if ($request->has('days')) {
        $days = (int) $request->query('days');
        $startDate = now()->subDays($days);
        $query->where('date_mesure', '>=', $startDate);
    }
    
    if ($request->has('date_from') && $request->has('date_to')) {
        $query->whereBetween('date_mesure', [
            $request->query('date_from'),
            $request->query('date_to')
        ]);
    }
    
    // Limiter le nombre de mesures pour éviter surcharge
    $limit = min((int) $request->query('limit', 1000), 5000);
    
    $mesures = $query
        ->orderBy('date_mesure', 'desc')
        ->limit($limit)
        ->get();
    
    return response()->json([
        'capteur_id' => $capteur->id,
        'mesures' => $mesures,
        'count' => $mesures->count()
    ]);
}



public function capteursByCliniqueUser($userId)
{
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable'], 404);
    }

    // Récupérer les ID des cliniques de l'utilisateur
    $cliniqueIds = $user->cliniques()->pluck('cliniques.id');

    // Capteurs de toutes les cliniques associées à cet utilisateur
    $capteurs = Capteur::whereHas('service.floor', function ($q) use ($cliniqueIds) {
        $q->whereIn('clinique_id', $cliniqueIds);
    })
    ->with(['famille.type', 'service.floor.clinique', 'alertes', 'derniereMesure','mesures'])
    ->get();

    return response()->json($capteurs, 200);
}
/**
 * ✅ Compteur d'alertes pour un capteur spécifique d'un utilisateur
 */
public function alertesCountByUser($userId, $capteurId)
{
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable'], 404);
    }

    // Récupérer les ID des cliniques de l'utilisateur via la relation many-to-many
    $cliniqueIds = $user->cliniques()->pluck('cliniques.id');

    // Vérifier que le capteur appartient bien à une clinique de l'utilisateur
    $capteur = Capteur::whereHas('service.floor', function ($query) use ($cliniqueIds) {
        $query->whereIn('clinique_id', $cliniqueIds);
    })->find($capteurId);

    if (!$capteur) {
        return response()->json(['message' => 'Capteur non trouvé ou accès refusé'], 404);
    }

    $totalAlertes = $capteur->alertes()->count();
    $activeAlertes = $capteur->alertes()
        ->whereIn('statut', ['actif', 'active'])
        ->count();

    return response()->json([
        'capteur_id' => (int) $capteurId,
        'total_alertes' => $totalAlertes,
        'active_alertes' => $activeAlertes
    ]);
}

/**
 * ✅ Compteurs d'alertes en batch pour les capteurs d'un utilisateur
 */
public function alertesCountBatchByUser(Request $request, $userId)
{
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable'], 404);
    }

    // Récupérer les ID des cliniques de l'utilisateur via la relation many-to-many
    $cliniqueIds = $user->cliniques()->pluck('cliniques.id');

    // Récupérer les IDs de capteurs depuis le query param (optionnel)
    $requestedIds = $request->has('ids') 
        ? explode(',', $request->input('ids')) 
        : null;

    // Base query: capteurs appartenant aux cliniques de l'utilisateur
    $query = Capteur::whereHas('service.floor', function ($q) use ($cliniqueIds) {
        $q->whereIn('clinique_id', $cliniqueIds);
    });

    // Filtrer par IDs spécifiques si fournis
    if ($requestedIds && count($requestedIds) > 0) {
        $query->whereIn('id', $requestedIds);
    }

    $capteurs = $query->with(['alertes' => function ($q) {
        $q->select('id', 'capteur_id', 'statut');
    }])->get(['id']);

    $result = [];
    foreach ($capteurs as $capteur) {
        $totalAlertes = $capteur->alertes->count();
        $activeAlertes = $capteur->alertes
            ->whereIn('statut', ['actif', 'active'])
            ->count();

        $result[(string) $capteur->id] = [
            'total_alertes' => $totalAlertes,
            'active_alertes' => $activeAlertes
        ];
    }

    return response()->json($result);
}
public function getMesuresByUser(Request $request, $userId, $sensorId)
{
    try {
        // Vérifier que le capteur appartient à l'utilisateur
        $cliniqueIds = DB::table('clinique_user')
            ->where('user_id', $userId)
            ->pluck('clinique_id')
            ->toArray();
        
        if (empty($cliniqueIds)) {
            return response()->json(['mesures' => []]);
        }
        
        $floorIds = DB::table('floors')
            ->whereIn('clinique_id', $cliniqueIds)
            ->pluck('id')
            ->toArray();
        
        if (empty($floorIds)) {
            return response()->json(['mesures' => []]);
        }
        
        $serviceIds = DB::table('services')
            ->whereIn('floor_id', $floorIds)
            ->pluck('id')
            ->toArray();
        
        if (empty($serviceIds)) {
            return response()->json(['mesures' => []]);
        }
        
        // Vérifier que le capteur existe et appartient aux services de l'utilisateur
        $capteurExists = DB::table('capteurs')
            ->where('id', $sensorId)
            ->whereIn('service_id', $serviceIds)
            ->exists();
        
        if (!$capteurExists) {
            return response()->json([
                'error' => 'Capteur non trouvé ou accès refusé'
            ], 403);
        }
        
        // Construire la requête des mesures
        $query = DB::table('mesures')
            ->where('capteur_id', $sensorId)
            ->orderBy('date_mesure', 'desc');
        
        // ✅ Gestion des périodes
        if ($request->has('hours')) {
            $hours = (int) $request->input('hours');
            $startDate = Carbon::now()->subHours($hours);
            $query->where('date_mesure', '>=', $startDate);
        } 
        elseif ($request->has('days')) {
            $days = (int) $request->input('days');
            $startDate = Carbon::now()->subDays($days);
            $query->where('date_mesure', '>=', $startDate);
        } 
        elseif ($request->has('dateFrom') && $request->has('dateTo')) {
            $startDate = Carbon::parse($request->input('dateFrom'))->startOfDay();
            $endDate = Carbon::parse($request->input('dateTo'))->endOfDay();
            $query->whereBetween('date_mesure', [$startDate, $endDate]);
        }
        
        // Limiter le nombre de résultats pour éviter la surcharge
        $limit = $request->input('limit', 1000);
        $mesures = $query->limit($limit)->get();
        
        return response()->json([
            'mesures' => $mesures
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Erreur getMesuresByUser:', [
            'user_id' => $userId,
            'sensor_id' => $sensorId,
            'error' => $e->getMessage(),
        ]);
        
        return response()->json([
            'error' => 'Erreur lors du chargement des mesures',
            'mesures' => []
        ], 500);
    }
}

    
}
