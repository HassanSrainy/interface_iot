<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Capteur;  // ✅ Import du Model
use App\Models\Alerte; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Afficher tous les utilisateurs avec leurs cliniques
     */
    public function index()
    {
        $users = User::with('cliniques')->get();
        return response()->json($users);
    }

    /**
     * Créer un nouvel utilisateur
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6',
            'role'         => 'required|in:admin,user',
            'clinique_ids'   => 'array',                // ✅ attendu du frontend
            'clinique_ids.*' => 'exists:cliniques,id',  // ✅ validation des IDs
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        // Associer les cliniques (si envoyées)
        if ($request->has('clinique_ids')) {
            $user->cliniques()->sync($request->clinique_ids);
        }

        return response()->json($user->load('cliniques'), 201);
    }

    /**
     * Afficher un utilisateur spécifique
     */
    public function show($id)
    {
        $user = User::with('cliniques')->find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        return response()->json($user);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $request->validate([
            'name'         => 'sometimes|string|max:255',
            'email'        => 'sometimes|email|unique:users,email,' . $user->id,
            'password'     => 'sometimes|string|min:6',
            'role'         => 'sometimes|in:admin,user',
            'clinique_ids'   => 'array',                // ✅
            'clinique_ids.*' => 'exists:cliniques,id',  // ✅
        ]);

        if ($request->has('name'))     $user->name = $request->name;
        if ($request->has('email'))    $user->email = $request->email;
        if ($request->has('password')) $user->password = Hash::make($request->password);
        if ($request->has('role'))     $user->role = $request->role;

        $user->save();

        // MAJ des cliniques associées
        if ($request->has('clinique_ids')) {
            $user->cliniques()->sync($request->clinique_ids);
        }

        return response()->json($user->load('cliniques'));
    }

    /**
     * Supprimer un utilisateur
     */
   public function destroy($id)
{
    // Récupérer l'utilisateur authentifié
    $authenticatedUser = auth('sanctum')->user();
    
    if (!$authenticatedUser) {
        return response()->json(['message' => 'Non authentifié'], 401);
    }

    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'Utilisateur non trouvé'], 404);
    }

    // ✅ Empêcher l'auto-suppression
    if ($authenticatedUser->id == $id) {
        return response()->json([
            'message' => 'Vous ne pouvez pas supprimer votre propre compte'
        ], 403);
    }

    $user->delete();

    return response()->json(['message' => 'Utilisateur supprimé']);
}
/**
 * Stats navbar : capteurs en ligne / total capteurs d'un utilisateur
 * Structure : User → clinique_user → Cliniques → Floors → Services → Capteurs
 */
public function getNavbarStats(Request $request, $userId)
{
    try {
        // Récupérer les IDs des cliniques de l'utilisateur
        $cliniqueIds = DB::table('clinique_user')
            ->where('user_id', $userId)
            ->pluck('clinique_id')
            ->toArray();
        
        if (empty($cliniqueIds)) {
            return response()->json([
                'sensors_count' => 0,
                'online_count' => 0,
                'alerts_count' => 0,
            ]);
        }
        
        // Récupérer les IDs des floors
        $floorIds = DB::table('floors')
            ->whereIn('clinique_id', $cliniqueIds)
            ->pluck('id')
            ->toArray();
        
        if (empty($floorIds)) {
            return response()->json([
                'sensors_count' => 0,
                'online_count' => 0,
                'alerts_count' => 0,
            ]);
        }
        
        // Récupérer les IDs des services
        $serviceIds = DB::table('services')
            ->whereIn('floor_id', $floorIds)
            ->pluck('id')
            ->toArray();
        
        if (empty($serviceIds)) {
            return response()->json([
                'sensors_count' => 0,
                'online_count' => 0,
                'alerts_count' => 0,
            ]);
        }
        
        // Compter tous les capteurs
        $sensorsCount = DB::table('capteurs')
            ->whereIn('service_id', $serviceIds)
            ->count();
        
        // Compter les capteurs online
        $onlineCount = DB::table('capteurs')
            ->whereIn('service_id', $serviceIds)
            ->where('status', 'online')
            ->count();
        
        // Compter les alertes actives
        $alertsCount = 0;
        try {
            $alertsCount = DB::table('alertes')
                ->join('capteurs', 'alertes.capteur_id', '=', 'capteurs.id')
                ->whereIn('capteurs.service_id', $serviceIds)
                ->where(function ($query) {
                    $query->where('alertes.status', 'actif')
                          ->orWhere('alertes.statut', 'actif')
                          ->orWhere('alertes.actif', 1);
                })
                ->count();
        } catch (\Exception $e) {
            \Log::warning('Table alertes introuvable:', ['error' => $e->getMessage()]);
        }
        
        return response()->json([
            'sensors_count' => $sensorsCount,
            'online_count' => $onlineCount,
            'alerts_count' => $alertsCount,
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Erreur getNavbarStats:', [
            'user_id' => $userId,
            'error' => $e->getMessage(),
        ]);
        
        return response()->json([
            'sensors_count' => 0,
            'online_count' => 0,
            'alerts_count' => 0,
        ], 200);
    }
}
}
