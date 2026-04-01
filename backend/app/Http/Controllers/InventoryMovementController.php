<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Cylinder;
use App\Models\CylinderStatusLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryMovementController extends Controller
{
    /**
     * Listado de movimientos (Kardex).
     */
    public function index(Request $request)
    {
        $query = InventoryMovement::with(['user', 'cylinder', 'fromLocation', 'toLocation']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('cylinder_barcode')) {
            $query->where('cylinder_barcode', $request->cylinder_barcode);
        }

        return response()->json($query->orderBy('movement_at', 'desc')->paginate(30));
    }

    /**
     * Procesar un movimiento de inventario.
     * Este es un método CRÍTICO que actualiza el estado y ubicación del balón.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cylinder_barcode' => 'required|exists:cylinders,barcode',
            'type' => 'required|in:Entry from Provider,Exit to Provider,Hospital Exchange,Trasiego/Refill,Patient Delivery,Patient Return',
            'location_from_id' => 'nullable|exists:locations,id',
            'location_to_id' => 'nullable|exists:locations,id',
            'batch_number' => 'nullable|string|max:100',
            'gas_expiration_date' => 'nullable|date',
            'quantity_loaded' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'transaction_group_id' => 'nullable|uuid',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $cylinder = Cylinder::findOrFail($validated['cylinder_barcode']);

            // 1. Crear el registro de movimiento
            $movement = new InventoryMovement($validated);
            $movement->user_id = $request->user()?->id ?? User::first()?->id; // Fallback para dev
            $movement->transaction_group_id = $validated['transaction_group_id'] ?? (string) Str::uuid();
            $movement->save();

            // 2. Lógica de negocio Pro: Actualizar estado del Cilindro según el movimiento
            $previousStatus = $cylinder->status;
            $newStatus = $previousStatus;

            switch ($validated['type']) {
                case 'Entry from Provider':
                    $newStatus = 'Full';
                    break;
                case 'Exit to Provider':
                    $newStatus = 'Empty'; // Generalmente se envían vacíos
                    break;
                case 'Patient Delivery':
                    $newStatus = 'Full';
                    break;
                case 'Patient Return':
                    $newStatus = 'Empty';
                    break;
            }

            // Registrar LOG de cambio de estado si cambió
            if ($previousStatus !== $newStatus) {
                CylinderStatusLog::create([
                    'cylinder_barcode' => $cylinder->barcode,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'user_id' => $movement->user_id,
                    'notes' => "Cambiado mediante movimiento: {$validated['type']}",
                    'created_at' => now()
                ]);
                $cylinder->status = $newStatus;
            }

            // Actualizar ubicación actual del balón
            if (!empty($validated['location_to_id'])) {
                $cylinder->current_location_id = $validated['location_to_id'];
            }

            $cylinder->save();

            return response()->json([
                'message' => 'Movimiento registrado y estado de balón actualizado.',
                'data' => $movement->load('cylinder')
            ], 201);
        });
    }
}
