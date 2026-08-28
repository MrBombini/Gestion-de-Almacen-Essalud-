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
            $attentionNumber = null;
            if (!empty($validated['patient_id'])) {
                $maxAttention = InventoryMovement::where('type', 'Exchange')
                    ->whereNotNull('patient_id')
                    ->max('attention_number');
                $attentionNumber = ($maxAttention ? (int) $maxAttention : 0) + 1;
            }

            $movement = InventoryMovement::create([
                'type'             => 'Exchange',
                'attention_number' => $attentionNumber,
                'shift'            => $validated['shift'],
                'patient_id'       => $validated['patient_id'] ?? null,
                'service_id'       => $validated['service_id'] ?? null,
                'bed_id'           => $validated['bed_id'] ?? null,
                'prescription_id'  => $validated['prescription_id'] ?? null,
                'user_id'          => Auth::id(),
                'notes'            => $validated['notes'] ?? null,
                'movement_at'      => Carbon::now()
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
                'current_bed_id'     => null
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
                        'location'           => 'PERIFERIE/CENTROS MEDICOS', // Destino específico para periferia
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

    public function createLoanReturn(Request $request)
    {
        $validated = $request->validate([
            'authority_id'       => ['required', 'exists:authorities,id'],
            'operation_type'     => ['required', 'string', 'in:Loan,Return'],
            'shift'              => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'cylinders'          => ['required', 'array', 'min:1'],
            'cylinders.*'        => ['exists:cylinders,id'],
            'notes'              => ['nullable', 'string']
        ]);

        return DB::transaction(function () use ($validated) {
            $movement = InventoryMovement::create([
                'type'               => $validated['operation_type'], // Loan or Return
                'authority_id'       => $validated['authority_id'],
                'shift'              => $validated['shift'],
                'user_id'            => Auth::id(),
                'movement_at'        => Carbon::now(),
                'notes'              => $validated['notes'] ?? null
            ]);

            foreach ($validated['cylinders'] as $cylinderId) {
                if ($validated['operation_type'] === 'Loan') {
                    // Prestar (Salida de Planta)
                    CylinderMovement::create([
                        'inventory_movement_id' => $movement->id,
                        'cylinder_id'           => $cylinderId,
                        'action'                => 'Exit',
                        'cylinder_status'       => 'in_use'
                    ]);

                    $cylinder = Cylinder::where('id', $cylinderId)->lockForUpdate()->first();
                    $cylinder->update([
                        'status'             => 'in_use',
                        'location'           => 'AUTORIDAD / TERCEROS',
                        'current_patient_id' => null,
                        'current_service_id' => null,
                        'current_bed_id'     => null
                    ]);
                } else {
                    // Devolución (Ingreso a Planta)
                    CylinderMovement::create([
                        'inventory_movement_id' => $movement->id,
                        'cylinder_id'           => $cylinderId,
                        'action'                => 'Entry',
                        'cylinder_status'       => 'empty'
                    ]);

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

            return response()->json($movement->load([
                'cylinderMovements.cylinder.ownershipType',
                'authority'
            ]), 201);
        });
    }

    /**
     * Devolución de balón de paciente PADOMI
     * El paciente devuelve su balón (fallecimiento, alta médica, viaje, etc.)
     */
    public function createPatientReturn(Request $request)
    {
        $validated = $request->validate([
            'patient_id'    => ['required', 'exists:patients,id'],
            'cylinder_id'   => ['required', 'exists:cylinders,id'],
            'reason'        => ['required', 'string', 'in:Fallecimiento,Alta médica,Viaje,Baja voluntaria,Otro'],
            'return_status' => ['required', 'string', 'in:empty,full'],
            'shift'         => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'notes'         => ['nullable', 'string']
        ]);

        // Validar que el cilindro esté asignado a este paciente
        $cylinder = Cylinder::find($validated['cylinder_id']);

        if (!$cylinder) {
            return response()->json(['message' => 'El cilindro no existe.'], 422);
        }

        if ($cylinder->current_patient_id != $validated['patient_id']) {
            return response()->json([
                'message' => 'El cilindro no está asignado a este paciente. Verifique los datos.'
            ], 422);
        }

        return DB::transaction(function () use ($validated, $cylinder) {
            // Registrar el movimiento de devolución
            $movement = InventoryMovement::create([
                'type'        => 'PatientReturn',
                'shift'       => $validated['shift'],
                'patient_id'  => $validated['patient_id'],
                'user_id'     => Auth::id(),
                'movement_at' => Carbon::now(),
                'notes'       => $validated['notes'] ?? null,
                'reason'      => $validated['reason'],
            ]);

            // Registrar el movimiento del cilindro (entra al almacén)
            CylinderMovement::create([
                'inventory_movement_id' => $movement->id,
                'cylinder_id'           => $cylinder->id,
                'action'                => 'Entry',
                'cylinder_status'       => $validated['return_status']
            ]);

            // Liberar el cilindro: regresa a CENTRAL sin paciente asignado
            $cylinder->lockForUpdate();
            $cylinder->update([
                'status'             => $validated['return_status'],
                'location'           => 'CENTRAL',
                'current_patient_id' => null,
                'current_service_id' => null,
                'current_bed_id'     => null,
            ]);

            // Anular / Suspender automáticamente todas las recetas activas del paciente
            Prescription::where('patient_id', $validated['patient_id'])
                ->where('status', 'active')
                ->update(['status' => 'inactive']);

            return response()->json($movement->load([
                'cylinderMovements.cylinder.ownershipType',
                'patient'
            ]), 201);
        });
    }

    /**
     * Préstamo de balón a paciente PADOMI
     * El paciente recibe un balón (se valida receta médica vigente)
     */
    public function createPatientLoan(Request $request)
    {
        $validated = $request->validate([
            'patient_id'           => ['required', 'exists:patients,id'],
            'cylinder_id'          => ['required', 'exists:cylinders,id'],
            'prescription_id'      => ['required', 'exists:prescriptions,id'],
            'expected_return_date' => ['nullable', 'date'],
            'shift'                => ['required', 'string', 'in:Morning,Afternoon,Night'],
            'notes'                => ['nullable', 'string']
        ]);

        // Validación de receta vigente
        $prescription = Prescription::find($validated['prescription_id']);
        $today = Carbon::now()->format('Y-m-d');
        if (!$prescription || $prescription->patient_id != $validated['patient_id'] || $today > $prescription->expires_at) {
            return response()->json(['message' => 'El paciente no tiene una receta médica válida y vigente.'], 422);
        }

        // Validación de cilindro
        $cylinder = Cylinder::where('id', $validated['cylinder_id'])->first();
        if (!$cylinder) {
            return response()->json(['message' => 'El cilindro no existe.'], 422);
        }

        if ($cylinder->status !== 'full' || strtoupper($cylinder->location) !== 'CENTRAL') {
            return response()->json([
                'message' => 'El cilindro debe estar lleno y ubicado en CENTRAL para poder ser prestado.'
            ], 422);
        }

        return DB::transaction(function () use ($validated, $cylinder) {
            $movement = InventoryMovement::create([
                'type'                 => 'PatientLoan',
                'shift'                => $validated['shift'],
                'patient_id'           => $validated['patient_id'],
                'prescription_id'      => $validated['prescription_id'],
                'user_id'              => Auth::id(),
                'movement_at'          => Carbon::now(),
                'notes'                => $validated['notes'] ?? null,
                'expected_return_date' => $validated['expected_return_date'] ?? null,
            ]);

            CylinderMovement::create([
                'inventory_movement_id' => $movement->id,
                'cylinder_id'           => $cylinder->id,
                'action'                => 'Exit',
                'cylinder_status'       => 'in_use'
            ]);

            $cylinder->lockForUpdate();
            $cylinder->update([
                'status'             => 'in_use',
                'location'           => 'PADOMI',
                'current_patient_id' => $validated['patient_id'],
                'current_service_id' => null,
                'current_bed_id'     => null,
            ]);

            return response()->json($movement->load([
                'cylinderMovements.cylinder.ownershipType',
                'patient'
            ]), 201);
        });
    }

    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 20);
        if ($perPage > 500) {
            $perPage = 500;
        }

        $movements = InventoryMovement::with([
                'user',
                'patient',
                'service',
                'authority',
                'bed',
                'supplier',
                'cylinderMovements.cylinder.ownershipType',
                'cylinderMovements.cylinder.supplier'
            ])
            ->orderBy('movement_at', 'desc')
            ->paginate($perPage);

        return response()->json($movements);
    }

    public function indexDecantings(Request $request)
    {
        $perPage = $request->query('per_page', 20);
        if ($perPage > 500) {
            $perPage = 500;
        }

        $query = Decanting::with([
                'user',
                'patient',
                'service',
                'cylinder.ownershipType',
                'prescription'
            ]);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = \Carbon\Carbon::parse($request->start_date)->startOfDay();
            $end = \Carbon\Carbon::parse($request->end_date)->endOfDay();
            $query->whereBetween('decanted_at', [$start, $end]);
        } elseif ($request->filled('start_date')) {
            $start = \Carbon\Carbon::parse($request->start_date)->startOfDay();
            $query->where('decanted_at', '>=', $start);
        } elseif ($request->filled('end_date')) {
            $end = \Carbon\Carbon::parse($request->end_date)->endOfDay();
            $query->where('decanted_at', '<=', $end);
        }

        if ($request->filled('capacity')) {
            $query->whereHas('cylinder', function ($q) use ($request) {
                $q->where('capacity', $request->capacity);
            });
        }

        $decantings = $query->orderBy('decanted_at', 'desc')
            ->paginate($perPage);

        return response()->json($decantings);
    }
}
