<?php

namespace App\Http\Controllers;

use App\Models\Clinique;
use Illuminate\Http\Request;

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
}
