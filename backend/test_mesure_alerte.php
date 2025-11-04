<?php
/**
 * Script de test pour vérifier la génération automatique d'alertes
 * 
 * Usage: php test_mesure_alerte.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Capteur;
use App\Models\Mesure;
use App\Models\Alerte;

echo "=== TEST GÉNÉRATION AUTOMATIQUE D'ALERTES ===\n\n";

// 1. Trouver un capteur avec des seuils définis
echo "1. Recherche d'un capteur avec seuils...\n";
$capteur = Capteur::whereNotNull('seuil_min')
    ->whereNotNull('seuil_max')
    ->first();

if (!$capteur) {
    echo "❌ Aucun capteur trouvé avec des seuils définis.\n";
    echo "Création d'un capteur de test...\n";
    
    $capteur = Capteur::create([
        'matricule' => 'TEST-' . time(),
        'seuil_min' => 10,
        'seuil_max' => 30,
        'status' => 'offline',
        'service_id' => 1, // Assurez-vous qu'un service existe
    ]);
}

echo "✅ Capteur trouvé: {$capteur->matricule}\n";
echo "   - Seuil MIN: {$capteur->seuil_min}\n";
echo "   - Seuil MAX: {$capteur->seuil_max}\n";
echo "   - Status: {$capteur->status}\n\n";

// 2. Supprimer les anciennes alertes pour ce test
echo "2. Nettoyage des anciennes alertes...\n";
Alerte::where('capteur_id', $capteur->id)->delete();
echo "✅ Alertes supprimées\n\n";

// 3. Test: Mesure dans les seuils (pas d'alerte)
echo "3. Test: Mesure dans les seuils...\n";
$mesure1 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => 20, // Entre min et max
    'date_mesure' => now(),
]);
echo "✅ Mesure créée: valeur = {$mesure1->valeur}\n";

// Vérifier le capteur
$capteur->refresh();
echo "   - Status capteur: {$capteur->status}\n";

// Vérifier les alertes
$alertes = Alerte::where('capteur_id', $capteur->id)->where('statut', 'actif')->get();
echo "   - Alertes actives: " . $alertes->count() . "\n";
echo ($alertes->count() === 0 ? "   ✅ Correct: Pas d'alerte (valeur dans les seuils)\n\n" : "   ❌ Erreur: Alerte créée alors que valeur OK\n\n");

// 4. Test: Mesure SOUS le seuil MIN (doit créer alerte)
echo "4. Test: Mesure SOUS le seuil MIN...\n";
$mesure2 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => 5, // Sous le min (10)
    'date_mesure' => now(),
]);
echo "✅ Mesure créée: valeur = {$mesure2->valeur} (seuil min = {$capteur->seuil_min})\n";

// Vérifier les alertes
$alertes = Alerte::where('capteur_id', $capteur->id)
    ->where('statut', 'actif')
    ->where('type', 'seuil_min')
    ->get();
    
echo "   - Alertes 'seuil_min' actives: " . $alertes->count() . "\n";
if ($alertes->count() === 1) {
    $alerte = $alertes->first();
    echo "   ✅ Alerte créée correctement\n";
    echo "      - ID: {$alerte->id}\n";
    echo "      - Type: {$alerte->type}\n";
    echo "      - Valeur: {$alerte->valeur}\n";
    echo "      - Critique: " . ($alerte->critique ? 'OUI' : 'NON') . "\n\n";
} else {
    echo "   ❌ Erreur: Alerte non créée!\n\n";
}

// 5. Test: Deuxième mesure SOUS le seuil (doit passer en CRITIQUE)
echo "5. Test: Deuxième mesure SOUS le seuil (doit passer CRITIQUE)...\n";
$mesure3 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => 3, // Encore sous le min
    'date_mesure' => now(),
]);
echo "✅ Mesure créée: valeur = {$mesure3->valeur}\n";

// Vérifier si l'alerte est passée en critique
$alerte = Alerte::where('capteur_id', $capteur->id)
    ->where('statut', 'actif')
    ->where('type', 'seuil_min')
    ->first();
    
if ($alerte && $alerte->critique) {
    echo "   ✅ Alerte passée en CRITIQUE\n\n";
} else {
    echo "   ❌ Erreur: Alerte non critique\n\n";
}

// 6. Test: Mesure AU-DESSUS du seuil MAX
echo "6. Test: Mesure AU-DESSUS du seuil MAX...\n";
$mesure4 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => 70, // AU-DESSUS du max (61)
    'date_mesure' => now(),
]);
echo "✅ Mesure créée: valeur = {$mesure4->valeur} (seuil max = {$capteur->seuil_max})\n";

// Vérifier les alertes
$alerteMax = Alerte::where('capteur_id', $capteur->id)
    ->where('statut', 'actif')
    ->where('type', 'seuil_max')
    ->first();
    
if ($alerteMax) {
    echo "   ✅ Alerte 'seuil_max' créée\n";
    echo "      - ID: {$alerteMax->id}\n";
    echo "      - Valeur: {$alerteMax->valeur}\n\n";
} else {
    echo "   ❌ Erreur: Alerte seuil_max non créée!\n\n";
}

// 7. Test: Mesure revenue dans les seuils (doit résoudre alertes)
echo "7. Test: Mesure revenue dans les seuils (résolution)...\n";
$mesure5 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => 20, // Revenue dans les seuils
    'date_mesure' => now(),
]);
echo "✅ Mesure créée: valeur = {$mesure5->valeur}\n";

// Vérifier que toutes les alertes sont résolues
$alertesActives = Alerte::where('capteur_id', $capteur->id)
    ->where('statut', 'actif')
    ->get();
    
echo "   - Alertes actives restantes: " . $alertesActives->count() . "\n";
if ($alertesActives->count() === 0) {
    echo "   ✅ Toutes les alertes ont été résolues\n\n";
} else {
    echo "   ❌ Erreur: Des alertes sont encore actives\n\n";
}

// 8. Résumé final
echo "=== RÉSUMÉ ===\n";
$toutesAlertes = Alerte::where('capteur_id', $capteur->id)->get();
echo "Total alertes créées: " . $toutesAlertes->count() . "\n";
echo "Alertes actives: " . $toutesAlertes->where('statut', 'actif')->count() . "\n";
echo "Alertes résolues: " . $toutesAlertes->where('statut', 'inactif')->count() . "\n";
echo "Alertes critiques: " . $toutesAlertes->where('critique', true)->count() . "\n\n";

echo "✅ Test terminé!\n";
echo "\nVérifiez les logs Laravel dans: storage/logs/laravel.log\n";
