<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Mesure;
use App\Models\Capteur;
use App\Models\Alerte;

class MesureController extends Controller
{
    public function index()
    {
        $mesures = Mesure::with('capteur')->get();
        return response()->json($mesures);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'capteur_id' => 'required|exists:capteurs,id',
            'valeur' => 'required|numeric',
            'date_mesure' => 'nullable|date',
        ]);

        // Création de la mesure
        $mesure = Mesure::create($validated);

        // Mettre à jour le capteur : date de connexion + statut online
        $capteur = Capteur::find($validated['capteur_id']);
        $capteur->date_derniere_connexion = now();
        $capteur->status = 'online';
        $capteur->save();

        // Désactiver les alertes de déconnexion actives (résolution)
        Alerte::where('capteur_id', $capteur->id)
            ->where('type', 'deconnexion')
            ->where('statut', 'actif')
            ->update([
                'statut' => 'inactif',
                'date_resolution' => now()
            ]);

        // Déterminer le type d'alerte selon le dépassement de seuil
        $alerteType = null;
        $valeurHorsSeuil = false;
        
        if ($capteur->seuil_min !== null && $validated['valeur'] < $capteur->seuil_min) {
            $alerteType = 'lower';
            $valeurHorsSeuil = true;
        } elseif ($capteur->seuil_max !== null && $validated['valeur'] > $capteur->seuil_max) {
            $alerteType = 'high';
            $valeurHorsSeuil = true;
        }

        if ($valeurHorsSeuil) {
            // Vérifier s'il existe déjà une alerte active du même type
            $alerteExistante = Alerte::where('capteur_id', $capteur->id)
                ->where('type', $alerteType)
                ->where('statut', 'actif')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($alerteExistante) {
                // Deuxième mesure consécutive hors seuil → passer à CRITIQUE
                if (!$alerteExistante->critique) {
                    $alerteExistante->critique = true;
                    $alerteExistante->save();
                }
            } else {
                // Première mesure hors seuil → créer alerte NON critique
                Alerte::create([
                    'capteur_id' => $capteur->id,
                    'mesure_id' => $mesure->id,
                    'type' => $alerteType,
                    'valeur' => $validated['valeur'],
                    'statut' => 'actif',
                    'critique' => false, // première occurrence = non critique
                    'date' => now(),
                ]);
            }
        } else {
            // Mesure dans les seuils → résoudre les alertes de seuil actives
            Alerte::where('capteur_id', $capteur->id)
                ->whereIn('type', ['high', 'lower'])
                ->where('statut', 'actif')
                ->update([
                    'statut' => 'inactif',
                    'date_resolution' => now()
                ]);
        }

        return response()->json($mesure, 201);
    }

    public function show(string $id)
    {
        $mesure = Mesure::with('capteur')->find($id);

        if (!$mesure) {
            return response()->json(['message' => 'Mesure non trouvée'], 404);
        }

        return response()->json($mesure);
    }

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
