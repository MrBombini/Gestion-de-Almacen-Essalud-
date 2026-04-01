<?php

namespace App\Http\Controllers;

use App\Models\CylinderCapacity;
use Illuminate\Http\Request;

class CylinderCapacityController extends Controller
{
    /**
     * Listado de todas las capacidades registradas.
     */
    public function index()
    {
        return response()->json(CylinderCapacity::all());
    }

    /**
     * Registrar una nueva capacidad (ej: 10m3, 6m3).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'value' => 'required|numeric',
            'unit' => 'required|string|max:10',
            'description' => 'nullable|string|max:255',
        ]);

        $capacity = CylinderCapacity::create($validated);

        return response()->json([
            'message' => 'Capacidad registrada correctamente',
            'data' => $capacity
        ], 201);
    }
}
