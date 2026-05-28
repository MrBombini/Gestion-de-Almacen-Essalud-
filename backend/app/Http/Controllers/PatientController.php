<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    public function index()
    {
        // Traemos el paciente con su receta más reciente
        return response()->json(Patient::with(['prescriptions' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->get());
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
            $patient = Patient::create($validated);

            // Crear receta inicial si hay datos
            if (!empty($validated['dosage']) || !empty($validated['expires_at'])) {
                Prescription::create([
                    'patient_id' => $patient->id,
                    'service_id' => null, // Por defecto nullable
                    'dosage'     => $validated['dosage'],
                    'usage_time' => $validated['usage_time'],
                    'expires_at' => $validated['expires_at'],
                    'promissory_note' => $validated['promissory_note'],
                    'authorization_date' => $validated['authorization_date'],
                    'status'     => 'active',
                    'issued_at'  => now(),
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
            $patient->update($validated);

            // [M-6] Solo actualizar o crear la receta activa si se envían datos esenciales de receta
            if (!empty($validated['dosage']) || !empty($validated['expires_at'])) {
                $prescription = Prescription::where('patient_id', $patient->id)
                    ->where('status', 'active')
                    ->first();

                $prescriptionData = [
                    'dosage'     => $validated['dosage'],
                    'usage_time' => $validated['usage_time'] ?? null,
                    'expires_at' => $validated['expires_at'],
                    'promissory_note' => $validated['promissory_note'] ?? null,
                    'authorization_date' => $validated['authorization_date'] ?? null,
                ];

                if ($prescription) {
                    $prescription->update($prescriptionData);
                } else {
                    Prescription::create(array_merge($prescriptionData, [
                        'patient_id' => $patient->id,
                        'service_id' => null, // [C-4] nullable service_id
                        'status'     => 'active',
                        'issued_at'  => now(),
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
