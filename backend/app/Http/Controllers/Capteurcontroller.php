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
        $capteurs = Capteur::with(['famille.type', 'service.floor.clinique', 'mesures', 'alertes','derniereMesure'])->get();
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
