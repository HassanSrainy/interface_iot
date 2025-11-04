<?php

use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;
use App\Http\Controllers\AuthController;

// Route CSRF pour Sanctum
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

// Auth login handled via web middleware so session is available
Route::post('/login', [AuthController::class, 'login']);
Route::get('/', function () {
    return view('welcome');
});
