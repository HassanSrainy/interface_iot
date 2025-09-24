<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Capteur;

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
}
