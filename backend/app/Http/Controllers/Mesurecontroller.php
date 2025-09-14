<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Mesure;
use App\Models\Capteur;

class MesureController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Récupérer toutes les mesures avec info capteur
        $mesures = Mesure::with('capteur')->get();
        return response()->json($mesures);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validation des données
        $validated = $request->validate([
            'capteur_id' => 'required|exists:capteurs,id',
            'valeur' => 'required|numeric',
            'date_mesure' => 'nullable|date',
        ]);

        $mesure = Mesure::create($validated);

        return response()->json($mesure, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $mesure = Mesure::with('capteur')->find($id);

        if (!$mesure) {
            return response()->json(['message' => 'Mesure non trouvée'], 404);
        }

        return response()->json($mesure);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $mesure = Mesure::find($id);

        if (!$mesure) {
            return response()->json(['message' => 'Mesure non trouvée'], 404);
        }

        $validated = $request->validate([
            'capteur_id' => 'sometimes|exists:capteurs,id',
            'valeur' => 'sometimes|numeric',
            'date_mesure' => 'nullable|date',
        ]);

        $mesure->update($validated);

        return response()->json($mesure);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $mesure = Mesure::find($id);

        if (!$mesure) {
            return response()->json(['message' => 'Mesure non trouvée'], 404);
        }

        $mesure->delete();

        return response()->json(['message' => 'Mesure supprimée avec succès']);
    }
}
