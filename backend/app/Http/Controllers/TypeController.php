<?php

namespace App\Http\Controllers;

use App\Models\Type;
use App\Models\Famille;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class TypeController extends Controller
{
    /**
     * Display a listing of the resource.
     * Optionnel: ?per_page=10 pour pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page');

        if ($perPage) {
            $items = Type::with('familles')->paginate((int) $perPage);
        } else {
            $items = Type::with('familles')->get();
        }

        return response()->json($items, Response::HTTP_OK);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        // Valider le champ "type" (aligné avec le modèle et le front)
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:types,type',
        ]);

        $type = Type::create($validated);

        // charger relations utiles
        $type->load('familles');

        return response()->json([
            'message' => 'Type créé avec succès',
            'data' => $type,
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        $type = Type::with('familles')->find($id);
        if (! $type) {
            return response()->json(['message' => 'Type introuvable'], Response::HTTP_NOT_FOUND);
        }

        return response()->json($type, Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $type = Type::find($id);
        if (! $type) {
            return response()->json(['message' => 'Type introuvable'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'type' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('types', 'type')->ignore($type->id),
            ],
        ]);

        $type->update($validated);
        $type->load('familles');

        return response()->json([
            'message' => 'Type mis à jour avec succès',
            'data' => $type,
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified resource from storage.
     * Pour éviter les incohérences FK, on refuse la suppression si des familles existent.
     */
    public function destroy($id): JsonResponse
    {
        $type = Type::withCount('familles')->find($id);
        if (! $type) {
            return response()->json(['message' => 'Type introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($type->familles_count > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce type : il est référencé par une ou plusieurs familles.',
                'familles_count' => $type->familles_count,
            ], Response::HTTP_CONFLICT);
        }

        $type->delete();

        return response()->json(['message' => 'Type supprimé avec succès'], Response::HTTP_OK);
    }
}
