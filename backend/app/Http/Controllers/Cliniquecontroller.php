<?php

namespace App\Http\Controllers;

use App\Models\Clinique;
use App\Models\Alerte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CliniqueController extends Controller
{
    /**
     * Afficher la liste des cliniques
     */
    public function index()
    {
        $cliniques = Clinique::with('floors.services.capteurs')->get();
        return response()->json($cliniques, 200);
    }

    /**
     * Créer une nouvelle clinique
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string|max:500',
        ]);

        $clinique = Clinique::create($validated);

        return response()->json([
            'message' => 'Clinique créée avec succès',
            'data' => $clinique
        ], 201);
    }

    /**
     * Afficher une clinique spécifique
     */
    public function show($id)
    {
        $clinique = Clinique::with('floors.services.capteurs')->find($id);

        if (!$clinique) {
            return response()->json(['message' => 'Clinique introuvable'], 404);
        }

        return response()->json($clinique, 200);
    }

    /**
     * Mettre à jour une clinique
     */
    public function update(Request $request, $id)
    {
        $clinique = Clinique::find($id);

        if (!$clinique) {
            return response()->json(['message' => 'Clinique introuvable'], 404);
        }

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'adresse' => 'nullable|string|max:500',
        ]);

        $clinique->update($validated);

        return response()->json([
            'message' => 'Clinique mise à jour avec succès',
            'data' => $clinique
        ], 200);
    }

    /**
     * Supprimer une clinique
     */
    public function destroy($id)
    {
        $clinique = Clinique::find($id);

        if (!$clinique) {
            return response()->json(['message' => 'Clinique introuvable'], 404);
        }

        $clinique->delete();

        return response()->json(['message' => 'Clinique supprimée avec succès'], 200);
    }


    // 1) Résumé par clinique (si on veut /cliniques/{id}/summary)
    public function summaryByClinique($cliniqueId)
    {
        $clinique = Clinique::find($cliniqueId);
        if (!$clinique) {
            return response()->json(['message' => 'Clinique introuvable'], 404);
        }

        // compter alertes liées à cette clinique (via les FK)
        $result = DB::table('alertes')
            ->join('capteurs', 'alertes.capteur_id', '=', 'capteurs.id')
            ->join('services', 'capteurs.service_id', '=', 'services.id')
            ->join('floors', 'services.floor_id', '=', 'floors.id')
            ->where('floors.clinique_id', $cliniqueId)
            ->select(DB::raw('COUNT(*) as total_alertes'), DB::raw("SUM(CASE WHEN LOWER(alertes.statut) = 'actif' THEN 1 ELSE 0 END) as active_alertes"))
            ->first();

        return response()->json([
            'id' => $clinique->id,
            'nom' => $clinique->nom,
            'adresse' => $clinique->adresse,
            'total_alertes' => $result->total_alertes ?? 0,
            'active_alertes' => $result->active_alertes ?? 0,
        ]);
    }

    // 2) Si tu veux la liste complète d'alertes par clinique (déjà fonctionnel chez toi)
    public function alertesParClinique($cliniqueId)
    {
        $alertes = Alerte::whereHas('capteur.service.floor', function($q) use ($cliniqueId) {
            $q->where('clinique_id', $cliniqueId);
        })->get();

        return response()->json($alertes);
    }
    public function getServicesByClinique($id)
{
    $clinique = Clinique::with(['floors' => function($q) {
        // charger services et leur compteur capteurs, ordonner par niveau si disponible
        $q->with(['services' => function($sq) {
            $sq->withCount('capteurs');
        }])->orderByRaw('CASE WHEN niveau IS NULL THEN 1 ELSE 0 END, niveau');
    }])->findOrFail($id);

    $floors = $clinique->floors->values();

    $services = $floors->flatMap(function ($floor, $index) {
        // priorise 'niveau' si présent, sinon fallback sur l'index
        $niveau = isset($floor->niveau) && is_numeric($floor->niveau) ? (int)$floor->niveau : null;

        // label : préférence au nom si fourni, sinon génération depuis niveau/index
        $label = !empty($floor->nom)
            ? $floor->nom
            : $this->formatFloorLabelFromNiveauOrIndex($niveau, $index);

        return collect($floor->services ?? [])->map(function ($service) use ($floor, $niveau, $label, $index) {
            return [
                'id' => $service->id,
                'nom' => $service->nom,
                'capteurs_count' => $service->capteurs_count ?? ($service->capteurs ? count($service->capteurs) : 0),
                'floor_id' => $floor->id,
                'floor_nom' => $floor->nom,
                // renvoie niveau si disponible sinon index (compatibilité)
                'floor_index' => $niveau !== null ? $niveau : $index,
                'floor_label' => $label,
            ];
        });
    })->values();

    return response()->json($services);
}

/**
 * Helper: génère un label lisible depuis $niveau (sinon depuis $fallbackIndex).
 */
protected function formatFloorLabelFromNiveauOrIndex(?int $niveau, int $fallbackIndex): string
{
    if ($niveau === null) {
        if ($fallbackIndex === 0) return 'Rez-de-chaussée';
        if ($fallbackIndex === 1) return '1er étage';
        return ($fallbackIndex + 1) . 'ème étage';
    }

    if ($niveau === 0) return 'Rez-de-chaussée';
    if ($niveau === 1) return '1er étage';
    return $niveau . 'ème étage';
}
public function cliniquesByUser($userId)
{
    $user = \App\Models\User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable'], 404);
    }

    // Relation many-to-many via la table pivot clinique_user
    $cliniques = $user->cliniques()->with('floors.services.capteurs')->get();

    return response()->json($cliniques, 200);
}

}
