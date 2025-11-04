<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Connexion
    public function login(Request $request)
    {
        try {
            Log::info('Début de la tentative de connexion', ['request' => $request->all()]);

            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            Log::info('Credentials validés', ['email' => $credentials['email']]);

            // Vérifier si l'utilisateur existe
            $user = \App\Models\User::where('email', $credentials['email'])->first();
            if (!$user) {
                Log::warning('Utilisateur non trouvé', ['email' => $credentials['email']]);
                return response()->json([
                    'message' => 'Utilisateur non trouvé'
                ], 401);
            }

            // Tentative de connexion
            if (!Auth::attempt($credentials)) {
                Log::warning('Échec de connexion - mot de passe incorrect', ['email' => $credentials['email']]);
                return response()->json([
                    'message' => 'Mot de passe incorrect'
                ], 401);
            }

            $request->session()->regenerate();
            
            $authenticatedUser = Auth::user();
            Log::info('Connexion réussie', [
                'user_id' => $authenticatedUser->id, 
                'email' => $authenticatedUser->email,
                'session_id' => $request->session()->getId()
            ]);

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $authenticatedUser
            ]);
        } catch (ValidationException $e) {
            Log::error('Erreur de validation', ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Erreur lors de la connexion', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'message' => 'Une erreur est survenue lors de la connexion',
                'debug' => $e->getMessage()
            ], 500);
        }
    }

    // Déconnexion
    public function logout(Request $request)
    {
        try {
            $user = Auth::user();
            Auth::guard('web')->logout();
            
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            Log::info('Déconnexion réussie', ['user_id' => $user?->id ?? 'unknown']);

            return response()->json([
                'message' => 'Déconnexion réussie'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la déconnexion', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Une erreur est survenue lors de la déconnexion'
            ], 500);
        }
    }

    /**
     * API login using token (for SPA or mobile clients that prefer bearer tokens).
     * Returns a plain-text personal access token.
     */
    public function apiLogin(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            // Vérifier si l'utilisateur existe
            $user = \App\Models\User::where('email', $credentials['email'])->first();
            
            if (!$user) {
                Log::warning('API login: User not found', ['email' => $credentials['email']]);
                return response()->json([
                    'message' => 'Utilisateur non trouvé',
                    'error' => 'user_not_found'
                ], 401);
            }

            // Tenter l'authentification
            if (!Auth::attempt($credentials)) {
                Log::warning('API login: Invalid password', ['email' => $credentials['email']]);
                return response()->json([
                    'message' => 'Mot de passe incorrect',
                    'error' => 'invalid_password'
                ], 401);
            }

            $user = Auth::user();
            // Create a personal access token (Sanctum)
            $token = $user->createToken('api-token')->plainTextToken;

            Log::info('API login successful', ['user_id' => $user->id, 'email' => $user->email]);

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $user,
                'token' => $token,
            ]);
        } catch (ValidationException $e) {
            Log::error('API login validation error', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('API login error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur serveur lors de la connexion',
                'error' => 'server_error'
            ], 500);
        }
    }

    /**
     * API logout for token-based auth: revoke current access token.
     */
    public function apiLogout(Request $request)
    {
        try {
            $token = $request->user()?->currentAccessToken();
            if ($token) {
                $token->delete();
            }
            return response()->json(['message' => 'Logged out']);
        } catch (\Exception $e) {
            Log::error('API logout error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Logout error'], 500);
        }
    }
}
