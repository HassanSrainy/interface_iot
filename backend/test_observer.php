<?php
/**
 * Test rapide - Création d'une mesure hors seuils
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Capteur;
use App\Models\Mesure;
use App\Models\Alerte;

$capteurId = $argv[1] ?? 1;

$capteur = Capteur::find($capteurId);
if (!$capteur) {
    echo "❌ Capteur introuvable\n";
    exit(1);
}

echo "=== Test Mesure Hors Seuils ===\n\n";
echo "Capteur: {$capteur->matricule}\n";
echo "Seuil MIN: {$capteur->seuil_min}\n";
echo "Seuil MAX: {$capteur->seuil_max}\n\n";

// Supprimer les anciennes alertes
Alerte::where('capteur_id', $capteur->id)->delete();
echo "✅ Anciennes alertes supprimées\n\n";

// Test 1: Mesure SOUS le seuil
$valeur1 = $capteur->seuil_min - 5;
echo "Test 1: Mesure SOUS le seuil ($valeur1)\n";
$mesure1 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => $valeur1,
    'date_mesure' => now(),
]);
echo "✅ Mesure créée (ID: {$mesure1->id})\n";

sleep(1);

$alertes = Alerte::where('capteur_id', $capteur->id)->where('statut', 'actif')->get();
echo "Alertes actives: {$alertes->count()}\n";
foreach ($alertes as $a) {
    echo "  - Type: {$a->type}, Critique: " . ($a->critique ? 'OUI' : 'NON') . "\n";
}
echo "\n";

// Test 2: Deuxième mesure SOUS le seuil (doit passer en CRITIQUE)
$valeur2 = $capteur->seuil_min - 3;
echo "Test 2: Deuxième mesure SOUS le seuil ($valeur2)\n";
$mesure2 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => $valeur2,
    'date_mesure' => now(),
]);
echo "✅ Mesure créée (ID: {$mesure2->id})\n";

sleep(1);

$alertes = Alerte::where('capteur_id', $capteur->id)->where('statut', 'actif')->get();
echo "Alertes actives: {$alertes->count()}\n";
foreach ($alertes as $a) {
    echo "  - Type: {$a->type}, Critique: " . ($a->critique ? 'OUI ⚠️' : 'NON') . "\n";
}
echo "\n";

// Test 3: Mesure AU-DESSUS du seuil
$valeur3 = $capteur->seuil_max + 10;
echo "Test 3: Mesure AU-DESSUS du seuil ($valeur3)\n";
$mesure3 = Mesure::create([
    'capteur_id' => $capteur->id,
    'valeur' => $valeur3,
    'date_mesure' => now(),
]);
echo "✅ Mesure créée (ID: {$mesure3->id})\n";

sleep(1);

$alertes = Alerte::where('capteur_id', $capteur->id)->where('statut', 'actif')->get();
echo "Alertes actives: {$alertes->count()}\n";
foreach ($alertes as $a) {
    echo "  - Type: {$a->type}, Critique: " . ($a->critique ? 'OUI' : 'NON') . "\n";
}
echo "\n";

echo "=== Test terminé ===\n";
echo "Vérifiez storage/logs/laravel.log pour les logs détaillés\n";
