<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Capteur;

class CapteurController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Récupérer tous les capteurs avec leur famille, service, mesures et alertes
        $capteurs = Capteur::with(['famille.type', 'service.floor.clinique', 'mesures', 'alertes'])->get();
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
        ]);

        $capteur = Capteur::create($validated);

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
            'matricule' => 'sometimes|string|unique:capteurs,matricule,' . $id,
            'date_installation' => 'nullable|date',
            'date_derniere_connexion' => 'nullable|date',
            'date_derniere_deconnexion' => 'nullable|date',
            'seuil_min' => 'nullable|numeric',
            'seuil_max' => 'nullable|numeric',
            'adresse_ip' => 'nullable|ip',
        ]);

        $capteur->update($validated);

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
