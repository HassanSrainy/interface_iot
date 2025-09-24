<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}
