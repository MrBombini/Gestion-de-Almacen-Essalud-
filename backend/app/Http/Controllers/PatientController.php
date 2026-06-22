<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $query = Patient::with(['prescriptions' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->orderBy('created_at', 'desc');

        // Filtro de Búsqueda
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', '%' . $search . '%')
                  ->orWhere('dni', 'like', '%' . $search . '%');
            });
        }

        // Filtro de Estado de Receta
        if ($request->has('rx_status') && $request->rx_status !== 'ALL') {
            if ($request->rx_status === 'ACTIVE') {
                $query->whereHas('prescriptions', function($q) {
                    $q->where('status', 'active');
                });
            } elseif ($request->rx_status === 'NONE') {
                $query->whereDoesntHave('prescriptions', function($q) {
                    $q->where('status', 'active');
                });
            }
        }

        // NUEVO: Filtro por Tipo de Código (Trasiego / Exchange)
        if ($request->has('code_type') && $request->code_type !== 'ALL') {
            if ($request->code_type === 'TRASIEGO') {
                $query->whereNotNull('trasiego_code');
            } elseif ($request->code_type === 'EXCHANGE') {
                $query->whereNotNull('exchange_code');
            }
        }

        $perPage = $request->get('per_page', 20);
        
        if ($perPage === 'all') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate((int)$perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'     => 'required|string|max:150',
            'dni'           => 'nullable|string|max:15|unique:patients,dni',
            'trasiego_code' => 'nullable|string|max:100',
            'exchange_code' => 'nullable|string|max:100',
            'address'       => 'nullable|string|max:255',
            'phone1'        => 'nullable|string|max:20',
            'phone2'        => 'nullable|string|max:20',
            // Campos de la Receta
            'dosage'        => 'nullable|string',
            'usage_time'    => 'nullable|string',
            'expires_at'    => 'nullable|date',
            'promissory_note' => 'nullable|string',
            'authorization_date' => 'nullable|date',
        ]);

        return DB::transaction(function() use ($validated) {
            $patientData = collect($validated)->only([
                'full_name', 'dni', 'trasiego_code', 'exchange_code', 'address', 'phone1', 'phone2'
            ])->toArray();
            
            $patient = Patient::create($patientData);

            // Crear receta inicial si hay datos
            if (!empty($validated['authorization_date']) || !empty($validated['expires_at'])) {
                Prescription::create([
                    'patient_id'         => $patient->id,
                    'service_id'         => null,
                    'dosage'             => $validated['dosage'] ?? null,
                    'usage_time'         => $validated['usage_time'] ?? null,
                    'expires_at'         => $validated['expires_at'] ?? null,
                    'promissory_note'    => $validated['promissory_note'] ?? null,
                    'authorization_date' => $validated['authorization_date'] ?? null,
                    'status'             => 'active',
                    'issued_at'          => $validated['authorization_date'] ?? now(),
                ]);
            }

            return response()->json($patient->load('prescriptions'), 201);
        });
    }

    public function show($id)
    {
        return response()->json(Patient::with('prescriptions')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);
        
        $validated = $request->validate([
            'full_name'     => 'required|string|max:150',
            'dni'           => 'nullable|string|max:15|unique:patients,dni,' . $id,
            'trasiego_code' => 'nullable|string|max:100',
            'exchange_code' => 'nullable|string|max:100',
            'address'       => 'nullable|string|max:255',
            'phone1'        => 'nullable|string|max:20',
            'phone2'        => 'nullable|string|max:20',
            // Campos de la Receta
            'dosage'        => 'nullable|string',
            'usage_time'    => 'nullable|string',
            'expires_at'    => 'nullable|date',
            'promissory_note' => 'nullable|string',
            'authorization_date' => 'nullable|date',
        ]);

        return DB::transaction(function() use ($patient, $validated) {
            $patientData = collect($validated)->only([
                'full_name', 'dni', 'trasiego_code', 'exchange_code', 'address', 'phone1', 'phone2'
            ])->toArray();

            $patient->update($patientData);

            // Solo actualizar o crear la receta activa si se envían datos esenciales de receta
            if (!empty($validated['authorization_date']) || !empty($validated['expires_at'])) {
                $prescription = Prescription::where('patient_id', $patient->id)
                    ->where('status', 'active')
                    ->first();

                $prescriptionData = [
                    'dosage'             => $validated['dosage'] ?? null,
                    'usage_time'         => $validated['usage_time'] ?? null,
                    'expires_at'         => $validated['expires_at'] ?? null,
                    'promissory_note'    => $validated['promissory_note'] ?? null,
                    'authorization_date' => $validated['authorization_date'] ?? null,
                    'issued_at'          => $validated['authorization_date'] ?? now(),
                ];

                if ($prescription) {
                    $prescription->update($prescriptionData);
                } else {
                    Prescription::create(array_merge($prescriptionData, [
                        'patient_id' => $patient->id,
                        'service_id' => null,
                        'status'     => 'active',
                    ]));
                }
            }

            return response()->json($patient->load('prescriptions'));
        });
    }

    public function destroy($id)
    {
        $patient = Patient::findOrFail($id);
        $patient->delete();
        return response()->json(['message' => 'Patient deleted successfully.']);
    }
}