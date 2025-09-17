<?php

namespace App\Http\Controllers;

use App\Models\Famille;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class FamilleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        // Option: ?per_page=10 pour pagination
        $perPage = $request->query('per_page');

        if ($perPage) {
            $familles = Famille::with('type')->paginate((int) $perPage);
        } else {
            $familles = Famille::with('type')->get();
        }

        return response()->json($familles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'famille' => 'required|string|max:255|unique:familles,famille',
            // adapter 'types' si ta table a un autre nom
            'type_id' => 'required|exists:types,id',
        ]);

        $famille = Famille::create($validated);

        // charger relation pour réponse
        $famille->load('type');

        return response()->json([
            'message' => 'Famille créée avec succès',
            'data' => $famille,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Famille $famille): JsonResponse
    {
        $famille->load('type');
        return response()->json($famille);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Famille $famille): JsonResponse
    {
        $validated = $request->validate([
            'famille' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('familles', 'famille')->ignore($famille->id),
            ],
            'type_id' => ['sometimes', 'exists:types,id'],
        ]);

        $famille->update($validated);
        $famille->load('type');

        return response()->json([
            'message' => 'Famille mise à jour avec succès',
            'data' => $famille,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Famille $famille): JsonResponse
    {
        $famille->delete();

        return response()->json([
            'message' => 'Famille supprimée avec succès',
        ]);
    }
}
