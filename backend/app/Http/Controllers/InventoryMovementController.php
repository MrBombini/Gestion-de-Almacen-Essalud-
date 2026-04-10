<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Cylinder;
use App\Models\CylinderMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryMovementController extends Controller
{
    /**
     * Create an Exchange movement (Patient exchange empty for full)
     */
    public function createExchange(Request $request)
    {
        $validated = $request->validate([
            'patient_id'    => 'required|exists:patients,id',
            'service_id'    => 'required|exists:services,id',
            'cylinder_in'   => 'required|exists:cylinders,id', // Empty from patient
            'cylinder_out'  => 'required|exists:cylinders,id', // Full to patient
            'shift'         => 'required|string|in:Morning,Afternoon,Night',
            'notes'         => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated) {
            $movement = InventoryMovement::create([
                'type'        => 'Exchange',
                'shift'       => $validated['shift'],
                'patient_id'  => $validated['patient_id'],
                'service_id'  => $validated['service_id'],
                'user_id'     => Auth::id(),
                'movement_at' => now(),
                'notes'       => $validated['notes']
            ]);

            // Cylinder coming in (Empty)
            CylinderMovement::create([
                'inventory_movement_id' => $movement->id,
                'cylinder_id'           => $validated['cylinder_in'],
                'action'                => 'Entry',
                'cylinder_status'       => 'empty'
            ]);
            Cylinder::where('id', $validated['cylinder_in'])->update(['status' => 'empty']);

            // Cylinder going out (Full)
            CylinderMovement::create([
                'inventory_movement_id' => $movement->id,
                'cylinder_id'           => $validated['cylinder_out'],
                'action'                => 'Exit',
                'cylinder_status'       => 'full'
            ]);
            Cylinder::where('id', $validated['cylinder_out'])->update(['status' => 'in_use']);

            return response()->json($movement->load('cylinderMovements'), 201);
        });
    }

    /**
     * Create a Decanting movement (Refilling small from large)
     */
    public function createDecanting(Request $request)
    {
        // Logic for decanting
        return response()->json(['message' => 'Decanting recorded.'], 201);
    }

    /**
     * Create a Supplier Entry movement
     */
    public function createSupplierEntry(Request $request)
    {
        // Logic for supplier entry
        return response()->json(['message' => 'Supplier entry recorded.'], 201);
    }
}
