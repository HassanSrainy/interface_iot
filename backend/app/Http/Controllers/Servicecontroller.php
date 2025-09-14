<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class ServiceController extends Controller
{
    /**
     * Afficher tous les services
     */
    public function index()
    {
        $services = Service::with('floor.clinique', 'capteurs')->get();
        return response()->json($services, 200);
    }

    /**
     * Créer un nouveau service
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'floor_id' => 'required|exists:floors,id',
        'nom' => 'required|string|max:255',
    ]);

    try {
        $service = Service::create($validated);

        return response()->json([
            'message' => 'Service créé avec succès',
            'data' => $service
        ], 201);

    } catch (QueryException $e) {
        // Vérifier si c’est une violation de clé unique
        if ($e->getCode() === '23000') {
            return response()->json([
                'message' => "Le service '{$validated['nom']}' existe déjà pour cet étage."
            ], 409); // 409 Conflict
        }

        // Pour toute autre erreur SQL
        return response()->json([
            'message' => 'Une erreur est survenue lors de la création du service.'
        ], 500);
    }
}


    /**
     * Afficher un service spécifique
     */
    public function show($id)
    {
        $service = Service::with('floor.clinique', 'capteurs')->find($id);

        if (!$service) {
            return response()->json(['message' => 'Service introuvable'], 404);
        }

        return response()->json($service, 200);
    }

    /**
     * Mettre à jour un service
     */
    public function update(Request $request, $id)
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json(['message' => 'Service introuvable'], 404);
        }

        $validated = $request->validate([
            'floor_id' => 'sometimes|exists:floors,id',
            'nom' => 'sometimes|string|max:255',
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Service mis à jour avec succès',
            'data' => $service
        ], 200);
    }

    /**
     * Supprimer un service
     */
    public function destroy($id)
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json(['message' => 'Service introuvable'], 404);
        }

        $service->delete();

        return response()->json(['message' => 'Service supprimé avec succès'], 200);
    }
}
