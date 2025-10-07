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
use Illuminate\Http\Request;
use App\Http\Controllers\TypeController;

Route::post('/login', [AuthController::class, 'login']);

// Routes protégées par token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});


Route::apiResource('cliniques', CliniqueController::class);
Route::apiResource('floors', FloorController::class);
Route::apiResource('services', ServiceController::class);
Route::apiResource('capteurs', CapteurController::class);
Route::apiResource('mesures', MesureController::class);
Route::apiResource('alertes', AlerteController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('familles', FamilleController::class);
Route::apiResource('types', TypeController::class);

// Nested routes pour relations
Route::get('/cliniques/{clinique}/floors', [App\Http\Controllers\FloorController::class, 'byClinique']);
Route::get('/floors/{floor}/services', [App\Http\Controllers\ServiceController::class, 'byFloor']);
// routes/api.php
Route::get('/capteurs/{id}/alertes/nbr', [CapteurController::class, 'alertesCount']);

Route::get('/cliniques/{clinique}/summary', [CliniqueController::class, 'summaryByClinique']); // résumé par clinique
Route::get('/cliniques/{clinique}/alertes', [CliniqueController::class, 'alertesParClinique']); // si déjà présent
// routes/api.php
Route::get('/cliniques/{id}/services', [CliniqueController::class, 'getServicesByClinique']);
//cliniques d'un user

Route::get('/users/{id}/cliniques', [CliniqueController::class, 'cliniquesByUser']);

    // Capteurs appartenant aux cliniques de cet utilisateur
Route::get('/users/{id}/capteurs', [CapteurController::class, 'capteursByCliniqueUser']);

    // Alertes appartenant aux cliniques de cet utilisateur
Route::get('/users/{id}/alertes', [AlerteController::class, 'alertesByCliniqueUser']);




Route::middleware('auth:sanctum')->get('/user', function (\Illuminate\Http\Request $request) {
    return $request->user();
});
Route::post('/logout-all', [AuthController::class, 'logoutAll']);
