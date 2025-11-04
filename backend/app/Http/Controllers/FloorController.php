<?php

namespace App\Http\Controllers;

use App\Models\Floor;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class FloorController extends Controller
{
    /**
     * Afficher tous les étages (triés par niveau puis id)
     */
    public function index()
    {
        $floors = Floor::with('clinique', 'services.capteurs')
            ->orderBy('clinique_id')
            ->orderBy('niveau')
            ->get();

        return response()->json($floors, 200);
    }

    /**
     * Créer un nouvel étage
     * -> niveau est requis (integer)
     * -> nom est requis (string)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'clinique_id' => 'required|exists:cliniques,id',
            'nom'         => 'required|string|max:255',
            'niveau'      => 'required|integer',
        ]);

        // Normalisation minimale du nom
        $validated['nom'] = ucfirst(strtolower(trim($validated['nom'])));

        try {
            // unicité nom dans la même clinique
            $existsNom = Floor::where('clinique_id', $validated['clinique_id'])
                ->whereRaw('LOWER(nom) = ?', [strtolower($validated['nom'])])
                ->exists();

            if ($existsNom) {
                return response()->json([
                    'message' => "L'étage '{$validated['nom']}' existe déjà pour cette clinique."
                ], 409);
            }

            // unicité niveau dans la même clinique
            $existsNiveau = Floor::where('clinique_id', $validated['clinique_id'])
                ->where('niveau', $validated['niveau'])
                ->exists();

            if ($existsNiveau) {
                return response()->json([
                    'message' => "Un étage avec le niveau {$validated['niveau']} existe déjà pour cette clinique."
                ], 409);
            }

            $floor = Floor::create($validated);

            return response()->json([
                'message' => 'Étage créé avec succès',
                'data'    => $floor
            ], 201);

        } catch (QueryException $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la création de l’étage.',
                'error' => $e->getMessage()
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
     * -> ici on utilise 'sometimes' parce que update peut être partiel (PATCH)
     */
    public function update(Request $request, $id)
    {
        $floor = Floor::find($id);

        if (!$floor) {
            return response()->json(['message' => 'Étage introuvable'], 404);
        }

        $validated = $request->validate([
            'clinique_id' => 'sometimes|exists:cliniques,id',
            'nom'         => 'sometimes|string|max:255',
            'niveau'      => 'sometimes|integer',
        ]);

        if (isset($validated['nom'])) {
            $validated['nom'] = ucfirst(strtolower(trim($validated['nom'])));

            $existsNom = Floor::where('clinique_id', $validated['clinique_id'] ?? $floor->clinique_id)
                ->whereRaw('LOWER(nom) = ?', [strtolower($validated['nom'])])
                ->where('id', '!=', $id)
                ->exists();

            if ($existsNom) {
                return response()->json([
                    'message' => "Un autre étage avec le nom '{$validated['nom']}' existe déjà dans cette clinique."
                ], 409);
            }
        }

        if (array_key_exists('niveau', $validated)) {
            $sameLevel = Floor::where('clinique_id', $validated['clinique_id'] ?? $floor->clinique_id)
                ->where('niveau', $validated['niveau'])
                ->where('id', '!=', $id)
                ->exists();

            if ($sameLevel) {
                return response()->json([
                    'message' => "Un autre étage avec le niveau {$validated['niveau']} existe déjà pour cette clinique."
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
            ->orderBy('niveau')
            ->get();

        return response()->json($floors);
    }
}
