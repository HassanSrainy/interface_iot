<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CliniqueController;
use App\Http\Controllers\FloorController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\CapteurController;
use App\Http\Controllers\MesureController;
use App\Http\Controllers\AlerteController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FamilleController;
use App\Http\Controllers\TypeController;

// ============================================
// AUTHENTIFICATION
// ============================================
// Token-based login (returns a personal access token) - PUBLIC
Route::post('/login', [AuthController::class, 'apiLogin']);

// ============================================
// ROUTES PROTÉGÉES PAR AUTHENTIFICATION
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    // Logout et user info
    Route::post('/logout', [AuthController::class, 'apiLogout']);
    Route::get('/user', fn(\Illuminate\Http\Request $request) => $request->user());

    // ============================================
    // RESOURCES STANDARDS
    // ============================================
    Route::apiResource('cliniques', CliniqueController::class);
    Route::apiResource('floors', FloorController::class);
    Route::apiResource('services', ServiceController::class);
    Route::apiResource('capteurs', CapteurController::class);
    Route::apiResource('mesures', MesureController::class);
    Route::apiResource('alertes', AlerteController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('familles', FamilleController::class);
    Route::apiResource('types', TypeController::class);

    // ============================================
    // ROUTES IMBRIQUÉES (NESTED)
    // ============================================
    Route::get('/cliniques/{clinique}/floors', [FloorController::class, 'byClinique']);
    Route::get('/cliniques/{clinique}/services', [CliniqueController::class, 'getServicesByClinique']);
    Route::get('/cliniques/{clinique}/summary', [CliniqueController::class, 'summaryByClinique']);
    Route::get('/cliniques/{clinique}/alertes', [CliniqueController::class, 'alertesParClinique']);

    Route::get('/floors/{floor}/services', [ServiceController::class, 'byFloor']);

    // ============================================
    // ROUTES CAPTEURS
    // ============================================
    Route::get('/capteurs/{id}/alertes/nbr', [CapteurController::class, 'alertesCount']);
    Route::get('/capteurs/alertes/nbr', [CapteurController::class, 'alertesCountBatch']);
    Route::get('/capteurs/{id}/mesures', [CapteurController::class, 'mesures']);

    // ============================================
    // ROUTES UTILISATEUR
    // ============================================
    Route::get('/users/{id}/cliniques', [CliniqueController::class, 'cliniquesByUser']);
    Route::get('/users/{userId}/capteurs', [CapteurController::class, 'capteursByCliniqueUser']);
    Route::get('/users/{userId}/alertes', [AlerteController::class, 'alertesByCliniqueUser']);
    Route::get('/users/{userId}/navbar-stats', [UserController::class, 'getNavbarStats']);

    // ✅ ROUTES ALERTES PAR UTILISATEUR
    Route::get('/users/{userId}/capteurs/{capteurId}/alertes/nbr', [CapteurController::class, 'alertesCountByUser']);
    Route::get('/users/{userId}/capteurs/alertes/nbr', [CapteurController::class, 'alertesCountBatchByUser']);

    // ✅ ROUTES MESURES PAR UTILISATEUR
    Route::get('/users/{userId}/capteurs/{capteurId}/mesures', [CapteurController::class, 'getMesuresByUser']);

    // ============================================
    // ROUTES ALERTES RÉSOLUES
    // ============================================
    Route::get('/alertes-resolved', [AlerteController::class, 'resolvedAlerts']);
    Route::get('/users/{userId}/alertes-resolved', [AlerteController::class, 'resolvedAlertsByUser']);
});