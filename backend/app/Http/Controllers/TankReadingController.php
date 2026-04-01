<?php

namespace App\Http\Controllers;

use App\Models\TankReading;
use App\Models\User;
use Illuminate\Http\Request;

class TankReadingController extends Controller
{
    /**
     * Listado de lecturas de tanques criogénicos.
     */
    public function index()
    {
        return response()->json(TankReading::with('user')->orderBy('recorded_at', 'desc')->paginate(20));
    }

    /**
     * Registrar una nueva lectura de nivel/presión.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tank_name' => 'required|string|max:100',
            'level_percentage' => 'required|numeric|min:0|max:100',
            'pressure_psi' => 'nullable|numeric|min:0',
            'current_m3' => 'nullable|numeric|min:0',
            'is_refill' => 'boolean',
            'quantity_added' => 'nullable|numeric|min:0',
            'shift' => 'required|in:Mañana,Tarde,Noche',
            'recorded_at' => 'nullable|date',
        ]);

        $reading = new TankReading($validated);
        $reading->user_id = $request->user()?->id ?? User::first()?->id;
        $reading->recorded_at = $validated['recorded_at'] ?? now();
        $reading->save();

        return response()->json([
            'message' => 'Lectura de tanque registrada correctamente',
            'data' => $reading,
            'is_critical' => $reading->isCritical()
        ], 201);
    }
}
