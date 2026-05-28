<?php

namespace App\Http\Controllers;

use App\Models\OwnershipType;
use Illuminate\Http\Request;

class OwnershipTypeController extends Controller
{
    public function index()
    {
        return response()->json(OwnershipType::withCount('cylinders')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:ownership_types,name',
        ]);

        $type = OwnershipType::create($validated);
        return response()->json($type, 201);
    }

    public function show($id)
    {
        return response()->json(OwnershipType::withCount('cylinders')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $type = OwnershipType::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:ownership_types,name,' . $id,
        ]);

        $type->update($validated);
        return response()->json($type);
    }

    public function destroy($id)
    {
        $type = OwnershipType::findOrFail($id);

        if ($type->cylinders()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar: tiene ' . $type->cylinders()->count() . ' balón(es) asociado(s).'
            ], 422);
        }

        $type->delete();
        return response()->json(['message' => 'Tipo de propiedad eliminado correctamente.']);
    }
}
