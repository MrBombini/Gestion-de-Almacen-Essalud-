<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Cylinder;
use App\Models\CylinderMovement;
use App\Models\Decanting;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryMovementController extends Controller
{
    /**
     * Create an Exchange movement (Patient exchange empty for full)
     */
    public function createExchange(Request $request)
    {
        $validated = $request->validate([
            'patient_id'      => ['nullable', 'exists:patients,id'],
            'service_id'      => ['nullable', 'exists:services,id'],
            'bed_id'          => ['nullable', 'exists:beds,id'],
            'prescription_id' => ['nullable', 'exists:prescriptions,id'],
            'cylinder_in'     => ['nullable', 'exists:cylinders,id'],
            'cylinder_out'    => ['nullable', 'exists:cylinders,id'],
            'shift'           => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'notes'           => ['nullable', 'string']
        ]);

        if (empty($validated['patient_id']) && empty($validated['service_id'])) {
            return response()->json(['message' => 'Debe seleccionar un Paciente o un Servicio.'], 422);
        }

        if (empty($validated['cylinder_in']) && empty($validated['cylinder_out'])) {
            return response()->json(['message' => 'Debe seleccionar al menos un cilindro de entrada (recibido) o de salida (entregado).'], 422);
        }

        // Validación de Receta para Pacientes
        if (!empty($validated['patient_id'])) {
            if (empty($validated['prescription_id'])) {
                return response()->json(['message' => 'Se requiere una receta activa para realizar un intercambio a un paciente.'], 422);
            }

            $prescription = Prescription::find($validated['prescription_id']);
            $today = Carbon::now()->format('Y-m-d');

            if (!$prescription || $today > $prescription->expires_at) {
                return response()->json(['message' => 'La receta del paciente ha expirado o es inválida.'], 422);
            }
        }

        // [C-3] Validar pertenencia/ubicación de cylinder_in si se proporciona
        if (!empty($validated['cylinder_in'])) {
            $cylinderInCheck = Cylinder::find($validated['cylinder_in']);
            if (!$cylinderInCheck) {
                return response()->json(['message' => 'El cilindro de entrada no existe.'], 422);
            }

            if (!empty($validated['patient_id'])) {
                if ($cylinderInCheck->current_patient_id != $validated['patient_id']) {
                    return response()->json(['message' => 'El cilindro a recibir no está asignado actualmente a este paciente.'], 422);
                }
            } elseif (!empty($validated['service_id'])) {
                if ($cylinderInCheck->current_service_id != $validated['service_id']) {
                    return response()->json(['message' => 'El cilindro a recibir no está asignado actualmente a este servicio.'], 422);
                }
                if (!empty($validated['bed_id']) && $cylinderInCheck->current_bed_id != $validated['bed_id']) {
                    return response()->json(['message' => 'El cilindro a recibir no está asignado a la cama especificada.'], 422);
                }
            }
        }

        return DB::transaction(function () use ($validated) {
            $movement = InventoryMovement::create([
                'type'            => 'Exchange',
                'shift'           => $validated['shift'],
                'patient_id'      => $validated['patient_id'] ?? null,
                'service_id'      => $validated['service_id'] ?? null,
                'bed_id'          => $validated['bed_id'] ?? null,
                'prescription_id' => $validated['prescription_id'] ?? null,
                'user_id'         => Auth::id(),
                'notes'           => $validated['notes'] ?? null,
                'movement_at'     => Carbon::now()
            ]);

            // Determinar la nueva ubicación según el destino
            $newLocation = 'CENTRAL';
            if ($validated['patient_id']) $newLocation = 'PADOMI';
            elseif ($validated['service_id']) $newLocation = 'HOSPITALIZACION';

            // 1. Cilindro Recibido (Entra vacío al almacén si se provee)
            if (!empty($validated['cylinder_in'])) {
                CylinderMovement::create([
                    'inventory_movement_id' => $movement->id,
                    'cylinder_id'           => $validated['cylinder_in'],
                    'action'                => 'Entry',
                    'cylinder_status'       => 'empty'
                ]);

                // [A-4] DB pessimistic locking
                $cylinderIn = Cylinder::where('id', $validated['cylinder_in'])->lockForUpdate()->first();
                $cylinderIn->update([
                    'status'             => 'empty',
                    'location'           => 'CENTRAL',
                    'current_patient_id' => null,
                    'current_service_id' => null,
                    'current_bed_id'     => null
                ]);
            }

            // 2. Cilindro Entregado (OPCIONAL: Solo si el paciente se lleva uno lleno)
            if (!empty($validated['cylinder_out'])) {
                CylinderMovement::create([
                    'inventory_movement_id' => $movement->id,
                    'cylinder_id'           => $validated['cylinder_out'],
                    'action'                => 'Exit',
                    'cylinder_status'       => 'in_use'
                ]);

                // [A-4] DB pessimistic locking
                $cylinderOut = Cylinder::where('id', $validated['cylinder_out'])->lockForUpdate()->first();
                $cylinderOut->update([
                    'status'             => 'in_use',
                    'location'           => $newLocation,
                    'current_patient_id' => $validated['patient_id'] ?? null,
                    'current_service_id' => $validated['service_id'] ?? null,
                    'current_bed_id'     => $validated['bed_id'] ?? null
                ]);
            }

            return response()->json($movement->load([
                'cylinderMovements.cylinder.ownershipType', // Trae el nombre de la propiedad del cilindro
                'service',                                  // Trae el nombre del servicio (Hospital Urubamba, etc.)
                'patient'                                   // Trae datos del paciente
            ]), 201);
        });
    }

    /**
     * Create a Decanting movement (Refilling small from large)
     */
    public function createDecanting(Request $request)
    {
        $validated = $request->validate([
            'cylinder_id'        => ['required', 'exists:cylinders,id'],
            'refilled_amount'    => ['required', 'numeric', 'min:0.01'],
            'shift'              => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'service_id'         => ['nullable', 'exists:services,id'],
            'bed_id'             => ['nullable', 'exists:beds,id'],
            'patient_id'         => ['nullable', 'exists:patients,id'],
            'prescription_id'    => ['nullable', 'exists:prescriptions,id'],
            'manual_destination' => ['nullable', 'string', 'max:150']
        ]);

        $cylinderCheck = Cylinder::find($validated['cylinder_id']);
        if (!$cylinderCheck) {
            return response()->json(['message' => 'El cilindro a recargar no existe.'], 422);
        }

        if ($validated['refilled_amount'] > $cylinderCheck->capacity) {
            return response()->json(['message' => "La cantidad recargada ({$validated['refilled_amount']} m³) supera la capacidad máxima del cilindro ({$cylinderCheck->capacity} m³)."], 422);
        }

        if (!empty($validated['patient_id'])) {
            if (empty($validated['prescription_id'])) {
                return response()->json(['message' => 'Se requiere una receta para recargar un balón a un paciente.'], 422);
            }

            $prescription = Prescription::find($validated['prescription_id']);
            if (!$prescription || Carbon::now()->format('Y-m-d') > $prescription->expires_at) {
                return response()->json(['message' => 'La receta del paciente ha expirado o es inválida.'], 422);
            }
        }

        return DB::transaction(function () use ($validated) {
            $decanting = Decanting::create([
                'cylinder_id'        => $validated['cylinder_id'],
                'refilled_amount'    => $validated['refilled_amount'],
                'shift'              => $validated['shift'],
                'service_id'         => $validated['service_id'] ?? null,
                'bed_id'             => $validated['bed_id'] ?? null,
                'patient_id'         => $validated['patient_id'] ?? null,
                'prescription_id'    => $validated['prescription_id'] ?? null,
                'manual_destination' => $validated['manual_destination'] ?? null,
                'user_id'            => Auth::id(),
                'decanted_at'        => Carbon::now()
            ]);

            // Ubicación según destino de trasiego
            $newLocation = 'CENTRAL';
            if ($validated['patient_id']) $newLocation = 'PADOMI';
            elseif ($validated['service_id']) $newLocation = 'HOSPITALIZACION';

            // [A-4] DB pessimistic locking
            $cylinder = Cylinder::where('id', $validated['cylinder_id'])->lockForUpdate()->first();
            $cylinder->update([
                'status'             => 'in_use',
                'location'           => $newLocation,
                'current_patient_id' => $validated['patient_id'] ?? null,
                'current_service_id' => $validated['service_id'] ?? null,
                'current_bed_id'     => $validated['bed_id'] ?? null
            ]);

            return response()->json($decanting->load(['service', 'patient', 'cylinder.ownershipType']), 201);
        });
    }

    public function createSupplierMovement(Request $request, $type = 'SupplierMovement')
    {
        $validated = $request->validate([
            'supplier_id'        => ['required', 'exists:suppliers,id'],
            'reference_document' => ['required', 'string', 'max:100'],
            'shift'              => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'cylinders_in'       => ['nullable', 'array'], // Balones que entran LLENOS
            'cylinders_in.*'     => ['exists:cylinders,id'],
            'cylinders_out'      => ['nullable', 'array'], // Balones que salen VACÍOS
            'cylinders_out.*'    => ['exists:cylinders,id'],
            'notes'              => ['nullable', 'string']
        ]);

        // [M-8] Validar que al menos uno tenga datos
        if (empty($validated['cylinders_in']) && empty($validated['cylinders_out'])) {
            return response()->json(['message' => 'Debe ingresar al menos un cilindro de entrada o de salida.'], 422);
        }

        return DB::transaction(function () use ($validated, $type) {
            $movement = InventoryMovement::create([
                'type'               => $type,
                'supplier_id'        => $validated['supplier_id'],
                'reference_document' => $validated['reference_document'],
                'shift'              => $validated['shift'],
                'user_id'            => Auth::id(),
                'movement_at'        => Carbon::now(),
                'notes'              => $validated['notes'] ?? null
            ]);

            // Procesar Entradas (Vienen del proveedor LLENOS)
            if (!empty($validated['cylinders_in'])) {
                foreach ($validated['cylinders_in'] as $cylinderId) {
                    CylinderMovement::create([
                        'inventory_movement_id' => $movement->id,
                        'cylinder_id'           => $cylinderId,
                        'action'                => 'Entry',
                        'cylinder_status'       => 'full'
                    ]);

                    // [A-4] DB pessimistic locking
                    $cylinder = Cylinder::where('id', $cylinderId)->lockForUpdate()->first();
                    $cylinder->update([
                        'status'             => 'full',
                        'location'           => 'CENTRAL', // Regresa al almacén central
                        'current_patient_id' => null,
                        'current_service_id' => null,
                        'current_bed_id'     => null
                    ]);
                }
            }

            // Procesar Salidas (Se van al proveedor VACÍOS)
            if (!empty($validated['cylinders_out'])) {
                foreach ($validated['cylinders_out'] as $cylinderId) {
                    CylinderMovement::create([
                        'inventory_movement_id' => $movement->id,
                        'cylinder_id'           => $cylinderId,
                        'action'                => 'Exit',
                        'cylinder_status'       => 'in_transit'
                    ]);

                    // [A-4] DB pessimistic locking
                    $cylinder = Cylinder::where('id', $cylinderId)->lockForUpdate()->first();
                    $cylinder->update([
                        'status'             => 'in_transit',
                        'location'           => 'PROVEEDOR', // Se va a recarga
                        'current_patient_id' => null,
                        'current_service_id' => null,
                        'current_bed_id'     => null
                    ]);
                }
            }

            return response()->json($movement->load([
                'cylinderMovements.cylinder.ownershipType', // Trae el nombre de la propiedad
                'supplier'                                  // Trae el nombre del proveedor (sdfs, etc.)
            ]), 201);
        });
    }

    public function createServiceBulkExchange(Request $request)
    {
        $validated = $request->validate([
            'service_id'         => ['required', 'exists:services,id'],
            'reference_document' => ['nullable', 'string', 'max:100'],
            'shift'              => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'cylinders_in'       => ['nullable', 'array'],
            'cylinders_in.*'     => ['exists:cylinders,id'],
            'cylinders_out'      => ['nullable', 'array'],
            'cylinders_out.*'    => ['exists:cylinders,id'],
            'notes'              => ['nullable', 'string']
        ]);

        return DB::transaction(function () use ($validated) {
            $movement = InventoryMovement::create([
                'type'               => 'ServiceBulkExchange',
                'service_id'         => $validated['service_id'],
                'reference_document' => $validated['reference_document'] ?? null,
                'shift'              => $validated['shift'],
                'user_id'            => Auth::id(),
                'movement_at'        => Carbon::now(),
                'notes'              => $validated['notes'] ?? null
            ]);

            if (!empty($validated['cylinders_in'])) {
                foreach ($validated['cylinders_in'] as $cylinderId) {
                    CylinderMovement::create([
                        'inventory_movement_id' => $movement->id,
                        'cylinder_id'           => $cylinderId,
                        'action'                => 'Entry',
                        'cylinder_status'       => 'empty'
                    ]);

                    // [A-4] DB pessimistic locking
                    $cylinder = Cylinder::where('id', $cylinderId)->lockForUpdate()->first();
                    $cylinder->update([
                        'status'             => 'empty',
                        'location'           => 'CENTRAL',
                        'current_patient_id' => null,
                        'current_service_id' => null,
                        'current_bed_id'     => null
                    ]);
                }
            }

            if (!empty($validated['cylinders_out'])) {
                foreach ($validated['cylinders_out'] as $cylinderId) {
                    CylinderMovement::create([
                        'inventory_movement_id' => $movement->id,
                        'cylinder_id'           => $cylinderId,
                        'action'                => 'Exit',
                        'cylinder_status'       => 'in_use'
                    ]);

                    // [A-4] DB pessimistic locking
                    $cylinder = Cylinder::where('id', $cylinderId)->lockForUpdate()->first();
                    $cylinder->update([
                        'status'             => 'in_use',
                        'location'           => 'HOSPITALIZACION', // Destino genérico para servicios
                        'current_patient_id' => null,
                        'current_service_id' => $validated['service_id'],
                        'current_bed_id'     => null
                    ]);
                }
            }

            return response()->json($movement->load([
                'cylinderMovements.cylinder.ownershipType',
                'service'
            ]), 201);
        });
    }

    public function createSupplierEntry(Request $request)
    {
        return $this->createSupplierMovement($request, 'SupplierEntry');
    }
}
