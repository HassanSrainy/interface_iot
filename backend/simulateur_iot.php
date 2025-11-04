<?php
/**
 * Simulateur IoT - Envoie des mesures pour tester le système d'alertes
 * 
 * Usage: php simulateur_iot.php [capteur_id]
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Capteur;
use App\Models\Mesure;

// Récupérer l'ID du capteur depuis les arguments ou demander
$capteurId = $argv[1] ?? null;

if (!$capteurId) {
    echo "Usage: php simulateur_iot.php [capteur_id]\n\n";
    
    // Afficher les capteurs disponibles
    $capteurs = Capteur::all();
    if ($capteurs->isEmpty()) {
        echo "❌ Aucun capteur trouvé. Créez d'abord un capteur depuis le frontend.\n";
        exit(1);
    }
    
    echo "Capteurs disponibles:\n";
    foreach ($capteurs as $c) {
        echo "  - ID {$c->id}: {$c->matricule} (seuil min: {$c->seuil_min}, max: {$c->seuil_max})\n";
    }
    echo "\nRelancez avec: php simulateur_iot.php [capteur_id]\n";
    exit(0);
}

// Charger le capteur
$capteur = Capteur::find($capteurId);
if (!$capteur) {
    echo "❌ Capteur ID $capteurId introuvable\n";
    exit(1);
}

echo "\n=== SIMULATEUR IoT - Capteur {$capteur->matricule} ===\n\n";
echo "Seuil MIN: {$capteur->seuil_min}\n";
echo "Seuil MAX: {$capteur->seuil_max}\n";
echo "Status actuel: {$capteur->status}\n\n";

// Scénario de test
$scenarios = [
    ['valeur' => 25, 'description' => 'Mesure normale (dans les seuils)', 'attente' => 3],
    ['valeur' => 30, 'description' => 'Mesure normale', 'attente' => 3],
    ['valeur' => 5, 'description' => '⚠️  Mesure SOUS le seuil MIN (crée alerte)', 'attente' => 5],
    ['valeur' => 3, 'description' => '🔴 Deuxième mesure SOUS le seuil (passe en CRITIQUE)', 'attente' => 5],
    ['valeur' => 20, 'description' => '✅ Mesure revenue normale (résout alerte)', 'attente' => 3],
    ['valeur' => 70, 'description' => '⚠️  Mesure AU-DESSUS du seuil MAX (crée alerte)', 'attente' => 5],
    ['valeur' => 80, 'description' => '🔴 Deuxième mesure AU-DESSUS (passe en CRITIQUE)', 'attente' => 5],
    ['valeur' => 25, 'description' => '✅ Mesure revenue normale (résout alerte)', 'attente' => 3],
];

echo "Simulation de " . count($scenarios) . " mesures...\n\n";

foreach ($scenarios as $index => $scenario) {
    $num = $index + 1;
    $total = count($scenarios);
    echo "[$num/$total] {$scenario['description']}\n";
    echo "        Valeur: {$scenario['valeur']}\n";
    
    // Créer la mesure
    $mesure = Mesure::create([
        'capteur_id' => $capteur->id,
        'valeur' => $scenario['valeur'],
        'date_mesure' => now(),
    ]);
    
    echo "        ✅ Mesure créée (ID: {$mesure->id})\n";
    
    // Vérifier les alertes
    $alertesActives = $capteur->alertes()->where('statut', 'actif')->get();
    
    if ($alertesActives->isEmpty()) {
        echo "        ℹ️  Aucune alerte active\n";
    } else {
        foreach ($alertesActives as $alerte) {
            $critique = $alerte->critique ? '🔴 CRITIQUE' : '⚠️  Normal';
            echo "        📢 Alerte: {$alerte->type} - $critique\n";
        }
    }
    
    // Rafraîchir le capteur
    $capteur->refresh();
    echo "        Status capteur: {$capteur->status}\n";
    
    // Attendre avant la prochaine mesure
    if ($index < count($scenarios) - 1) {
        echo "        ⏳ Attente {$scenario['attente']}s...\n\n";
        sleep($scenario['attente']);
    }
}

echo "\n=== RÉSUMÉ FINAL ===\n";
$capteur->refresh();
echo "Status capteur: {$capteur->status}\n";
echo "Dernière connexion: {$capteur->date_derniere_connexion}\n\n";

$alertes = $capteur->alertes;
echo "Total alertes créées: {$alertes->count()}\n";
echo "Alertes actives: " . $alertes->where('statut', 'actif')->count() . "\n";
echo "Alertes résolues: " . $alertes->where('statut', 'inactif')->count() . "\n";
echo "Alertes critiques: " . $alertes->where('critique', true)->count() . "\n\n";

echo "✅ Simulation terminée!\n";
echo "Vérifiez le frontend pour voir les alertes en temps réel.\n\n";
