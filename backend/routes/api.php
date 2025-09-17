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
// Nested routes pour relations
Route::get('/cliniques/{clinique}/floors', [App\Http\Controllers\FloorController::class, 'byClinique']);
Route::get('/floors/{floor}/services', [App\Http\Controllers\ServiceController::class, 'byFloor']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
