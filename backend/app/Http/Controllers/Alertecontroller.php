<?php

namespace App\Http\Controllers;

use App\Models\Alerte;
use Illuminate\Http\Request;
use App\Models\User;

class AlerteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Récupère toutes les alertes avec leurs relations capteur et mesure
        $alertes = Alerte::with(['capteur', 'mesure'])->get();
        return response()->json($alertes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validation des données
        $validated = $request->validate([
            'capteur_id' => 'required|exists:capteurs,id',
            'mesure_id' => 'nullable|exists:mesures,id', // <-- nullable ici
            'type' => 'required|string|max:255',
            'valeur' => 'required|numeric',
            'date' => 'required|date',
            'statut' => 'required|string|max:50',
        ]);

        // Création de l'alerte
        $alerte = Alerte::create($validated);

        return response()->json($alerte, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $alerte = Alerte::with(['capteur', 'mesure'])->find($id);

        if (!$alerte) {
            return response()->json(['message' => 'Alerte non trouvée'], 404);
        }

        return response()->json($alerte);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $alerte = Alerte::find($id);

        if (!$alerte) {
            return response()->json(['message' => 'Alerte non trouvée'], 404);
        }

        $validated = $request->validate([
            'capteur_id' => 'sometimes|exists:capteurs,id',
            'mesure_id' => 'sometimes|exists:mesures,id',
            'type' => 'sometimes|string|max:255',
            'valeur' => 'sometimes|numeric',
            'date' => 'sometimes|date',
            'statut' => 'sometimes|string|max:50',
        ]);

        $alerte->update($validated);

        return response()->json($alerte);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $alerte = Alerte::find($id);

        if (!$alerte) {
            return response()->json(['message' => 'Alerte non trouvée'], 404);
        }

        $alerte->delete();

        return response()->json(['message' => 'Alerte supprimée avec succès']);
    }


public function alertesByCliniqueUser($userId)
{
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable'], 404);
    }

    $cliniqueIds = $user->cliniques()->pluck('cliniques.id');

    // Toutes les alertes liées aux capteurs de ces cliniques
    $alertes = Alerte::whereHas('capteur.service.floor', function ($q) use ($cliniqueIds) {
        $q->whereIn('clinique_id', $cliniqueIds);
    })
    ->with(['capteur.famille', 'capteur.service.floor.clinique'])
    ->get();

    return response()->json($alertes, 200);
}

/**
 * Get resolved alerts with date filter
 */
public function resolvedAlerts(Request $request)
{
    $query = Alerte::where('statut', 'inactif')
        ->whereNotNull('date_resolution')
        ->with(['capteur', 'mesure']);

    // Filtrer par période si spécifié
    if ($request->has('period')) {
        $period = $request->input('period');
        
        switch ($period) {
            case 'today':
                $query->whereDate('date_resolution', today());
                break;
            case '7days':
                $query->where('date_resolution', '>=', now()->subDays(7));
                break;
            case 'custom':
                if ($request->has('start_date') && $request->has('end_date')) {
                    $query->whereBetween('date_resolution', [
                        $request->input('start_date'),
                        $request->input('end_date')
                    ]);
                }
                break;
        }
    }

    $alertes = $query->orderBy('date_resolution', 'desc')->get();
    
    return response()->json($alertes, 200);
}

/**
 * Get resolved alerts for specific user
 */
public function resolvedAlertsByUser($userId, Request $request)
{
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable'], 404);
    }

    $cliniqueIds = $user->cliniques()->pluck('cliniques.id');

    $query = Alerte::where('statut', 'inactif')
        ->whereNotNull('date_resolution')
        ->whereHas('capteur.service.floor', function ($q) use ($cliniqueIds) {
            $q->whereIn('clinique_id', $cliniqueIds);
        })
        ->with(['capteur.famille', 'capteur.service.floor.clinique']);

    // Filtrer par période
    if ($request->has('period')) {
        $period = $request->input('period');
        
        switch ($period) {
            case 'today':
                $query->whereDate('date_resolution', today());
                break;
            case '7days':
                $query->where('date_resolution', '>=', now()->subDays(7));
                break;
            case 'custom':
                if ($request->has('start_date') && $request->has('end_date')) {
                    $query->whereBetween('date_resolution', [
                        $request->input('start_date'),
                        $request->input('end_date')
                    ]);
                }
                break;
        }
    }

    $alertes = $query->orderBy('date_resolution', 'desc')->get();
    
    return response()->json($alertes, 200);
}

}
