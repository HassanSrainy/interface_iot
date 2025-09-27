<?php

namespace App\Http\Controllers;

use App\Models\Floor;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class FloorController extends Controller
{
    /**
     * Afficher tous les étages
     */
    public function index()
    {
        $floors = Floor::with('clinique', 'services.capteurs')->get();
        return response()->json($floors, 200);
    }

    /**
     * Créer un nouvel étage
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'clinique_id' => 'required|exists:cliniques,id',
            'nom' => 'required|string|max:255',
        ]);

        // Normalisation du nom : première lettre majuscule, reste minuscule
        $validated['nom'] = ucfirst(strtolower(trim($validated['nom'])));

        try {
            // Vérifier si le même nom existe déjà pour la clinique
            $exists = Floor::where('clinique_id', $validated['clinique_id'])
                ->whereRaw('LOWER(nom) = ?', [strtolower($validated['nom'])])
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => "L'étage '{$validated['nom']}' existe déjà pour cette clinique."
                ], 409);
            }

            $floor = Floor::create($validated);

            return response()->json([
                'message' => 'Étage créé avec succès',
                'data' => $floor
            ], 201);

        } catch (QueryException $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la création de l’étage.'
            ], 500);
        }
    }

    /**
     * Afficher un étage spécifique
     */
    public function show($id)
    {
        $floor = Floor::with('clinique', 'services.capteurs')->find($id);

        if (!$floor) {
            return response()->json(['message' => 'Étage introuvable'], 404);
        }

        return response()->json($floor, 200);
    }

    /**
     * Mettre à jour un étage
     */
    public function update(Request $request, $id)
    {
        $floor = Floor::find($id);

        if (!$floor) {
            return response()->json(['message' => 'Étage introuvable'], 404);
        }

        $validated = $request->validate([
            'clinique_id' => 'sometimes|exists:cliniques,id',
            'nom' => 'sometimes|string|max:255',
            'numero' => 'sometimes|integer',
        ]);

        if (isset($validated['nom'])) {
            $validated['nom'] = ucfirst(strtolower(trim($validated['nom'])));

            // Vérifier unicité dans la clinique
            $exists = Floor::where('clinique_id', $validated['clinique_id'] ?? $floor->clinique_id)
                ->whereRaw('LOWER(nom) = ?', [strtolower($validated['nom'])])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => "Un autre étage avec le nom '{$validated['nom']}' existe déjà dans cette clinique."
                ], 409);
            }
        }

        $floor->update($validated);

        return response()->json([
            'message' => 'Étage mis à jour avec succès',
            'data' => $floor
        ], 200);
    }

    /**
     * Supprimer un étage
     */
    public function destroy($id)
    {
        $floor = Floor::find($id);

        if (!$floor) {
            return response()->json(['message' => 'Étage introuvable'], 404);
        }

        $floor->delete();

        return response()->json(['message' => 'Étage supprimé avec succès'], 200);
    }

    /**
     * Lister les étages d’une clinique donnée
     */
    public function byClinique($cliniqueId)
    {
        $floors = Floor::where('clinique_id', $cliniqueId)
            ->with('services.capteurs')
            ->get();

        return response()->json($floors);
    }
}
