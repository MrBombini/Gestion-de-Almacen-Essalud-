<?php

namespace App\Http\Controllers;

use App\Models\GasType;
use Illuminate\Http\Request;

class GasTypeController extends Controller
{
    /**
     * Listado de tipos de gases (Oxígeno, Vacío, etc).
     */
    public function index()
    {
        return response()->json(GasType::all());
    }

    /**
     * Registrar un nuevo tipo de gas.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:gas_types',
            'unit' => 'required|string|max:20',
            'min_stock' => 'nullable|integer|min:0',
        ]);

        $gasType = GasType::create($validated);

        return response()->json([
            'message' => 'Tipo de gas registrado correctamente',
            'data' => $gasType
        ], 201);
    }
}
