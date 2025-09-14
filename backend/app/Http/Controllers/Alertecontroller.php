<?php

namespace App\Http\Controllers;

use App\Models\Alerte;
use Illuminate\Http\Request;

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
}
