<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Listado de ubicaciones (Servicios, camas, etc).
     */
    public function index()
    {
        return response()->json(Location::all());
    }

    /**
     * Registrar una nueva ubicación.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_name' => 'required|string|max:100',
            'identifier' => 'nullable|string|max:50',
            'short_code' => 'nullable|string|max:10',
            'type' => 'required|in:BED,SERVICE,PADOMI,EXTERNAL',
        ]);

        $location = Location::create($validated);

        return response()->json([
            'message' => 'Ubicación registrada correctamente',
            'data' => $location
        ], 201);
    }

    /**
     * Actualizar una ubicación.
     */
    public function update(Request $request, $id)
    {
        $location = Location::findOrFail($id);

        $validated = $request->validate([
            'service_name' => 'sometimes|required|string|max:100',
            'identifier' => 'nullable|string|max:50',
            'short_code' => 'nullable|string|max:10',
            'type' => 'sometimes|required|in:BED,SERVICE,PADOMI,EXTERNAL',
        ]);

        $location->update($validated);

        return response()->json([
            'message' => 'Ubicación actualizada correctamente',
            'data' => $location
        ]);
    }
}
