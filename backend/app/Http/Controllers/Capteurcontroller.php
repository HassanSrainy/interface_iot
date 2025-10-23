<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Capteur;
use App\Models\User;
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

    
}
