<?php

namespace App\Http\Controllers;

use App\Models\CylinderModel;
use Illuminate\Http\Request;

class CylinderModelController extends Controller
{
    /**
     * Listado de modelos (Taller, Tanque, etc).
     */
    public function index()
    {
        return response()->json(CylinderModel::all());
    }

    /**
     * Registrar un nuevo modelo.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:cylinder_models',
        ]);

        $model = CylinderModel::create($validated);

        return response()->json([
            'message' => 'Modelo de cilindro registrado correctamente',
            'data' => $model
        ], 201);
    }
}
