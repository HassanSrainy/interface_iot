<?php

namespace App\Observers;

use App\Models\Mesure;
use App\Models\Capteur;
use App\Models\Alerte;
use Illuminate\Support\Facades\Log;

class MesureObserver
{
    /**
     * Handle the Mesure "created" event.
     * Génération automatique des alertes lors de la création d'une mesure
     */
    public function created(Mesure $mesure): void
    {
        // Récupérer le capteur avec ses seuils
        $capteur = Capteur::find($mesure->capteur_id);
        
        if (!$capteur) {
            Log::warning("Capteur introuvable pour mesure", ['mesure_id' => $mesure->id]);
            return;
        }
        
        // Log pour debug
        Log::info('Mesure créée (Observer)', [
            'capteur_id' => $capteur->id,
            'matricule' => $capteur->matricule,
            'valeur' => $mesure->valeur,
            'seuil_min' => $capteur->seuil_min,
            'seuil_max' => $capteur->seuil_max,
        ]);

        // Mettre à jour le capteur : date de connexion + statut online
        $capteur->date_derniere_connexion = now();
        $capteur->status = 'online';
        $capteur->save();

        // Désactiver les alertes de déconnexion actives (résolution)
        $alertesDeconnexionResolues = Alerte::where('capteur_id', $capteur->id)
            ->where('type', 'deconnexion')
            ->where('statut', 'actif')
            ->update([
                'statut' => 'inactif',
                'date_resolution' => now()
            ]);

        if ($alertesDeconnexionResolues > 0) {
            Log::info("Alertes de déconnexion résolues: $alertesDeconnexionResolues");
        }

        // Déterminer le type d'alerte selon le dépassement de seuil
        $alerteType = null;
        $valeurHorsSeuil = false;
        
        if ($capteur->seuil_min !== null && $mesure->valeur < $capteur->seuil_min) {
            $alerteType = 'seuil_min';  // Type cohérent avec le frontend
            $valeurHorsSeuil = true;
            Log::info("Seuil MIN dépassé: {$mesure->valeur} < {$capteur->seuil_min}");
        } elseif ($capteur->seuil_max !== null && $mesure->valeur > $capteur->seuil_max) {
            $alerteType = 'seuil_max';  // Type cohérent avec le frontend
            $valeurHorsSeuil = true;
            Log::info("Seuil MAX dépassé: {$mesure->valeur} > {$capteur->seuil_max}");
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
                    Log::warning("Alerte passée en CRITIQUE", [
                        'alerte_id' => $alerteExistante->id,
                        'type' => $alerteType,
                        'capteur' => $capteur->matricule,
                    ]);
                }
            } else {
                // Première mesure hors seuil → créer alerte NON critique
                $nouvelleAlerte = Alerte::create([
                    'capteur_id' => $capteur->id,
                    'mesure_id' => $mesure->id,
                    'type' => $alerteType,
                    'valeur' => $mesure->valeur,
                    'statut' => 'actif',
                    'critique' => false, // première occurrence = non critique
                    'date' => now(),
                ]);
                
                Log::warning("Nouvelle alerte créée (Observer)", [
                    'alerte_id' => $nouvelleAlerte->id,
                    'type' => $alerteType,
                    'valeur' => $mesure->valeur,
                    'capteur' => $capteur->matricule,
                    'critique' => false,
                ]);
            }
        } else {
            // Mesure dans les seuils → résoudre les alertes de seuil actives
            $alertesResolues = Alerte::where('capteur_id', $capteur->id)
                ->whereIn('type', ['seuil_max', 'seuil_min', 'high', 'lower'])  // Support anciens types aussi
                ->where('statut', 'actif')
                ->update([
                    'statut' => 'inactif',
                    'date_resolution' => now()
                ]);
                
            if ($alertesResolues > 0) {
                Log::info("Alertes de seuil résolues: $alertesResolues (valeur revenue dans les seuils)");
            }
        }
    }
}
