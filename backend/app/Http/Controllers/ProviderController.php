<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use Illuminate\Http\Request;

class ProviderController extends Controller
{
    /**
     * Listado de todos los proveedores (Dueños de balones).
     */
    public function index()
    {
        return response()->json(Provider::all());
    }

    /**
     * Registrar un nuevo proveedor (linde, praxair, airlliquid, etc).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255|unique:providers',
            'tax_id' => 'nullable|string|max:20',
        ]);

        $provider = Provider::create($validated);

        return response()->json([
            'message' => 'Proveedor registrado correctamente',
            'data' => $provider
        ], 201);
    }
}
