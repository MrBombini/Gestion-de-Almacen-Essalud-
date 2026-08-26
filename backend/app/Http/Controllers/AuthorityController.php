<?php

namespace App\Http\Controllers;

use App\Models\Authority;
use Illuminate\Http\Request;

class AuthorityController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $search = $request->query('search', '');

        $query = Authority::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
        }

        if ($perPage === 'all') {
            return response()->json($query->orderBy('name')->get());
        }

        return response()->json($query->orderBy('name')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:authorities',
            'type' => 'nullable|string|max:50',
        ]);

        $authority = Authority::create($validated);
        return response()->json($authority, 201);
    }

    public function show(Authority $authority)
    {
        return response()->json($authority);
    }

    public function update(Request $request, Authority $authority)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:authorities,name,' . $authority->id,
            'type' => 'nullable|string|max:50',
        ]);

        $authority->update($validated);
        return response()->json($authority);
    }

    public function destroy(Authority $authority)
    {
        // Verificar si tiene movimientos asociados
        if ($authority->inventoryMovements()->exists()) {
            return response()->json(['message' => 'No se puede eliminar la autoridad porque tiene movimientos asociados.'], 400);
        }

        $authority->delete();
        return response()->json(null, 204);
    }
}
