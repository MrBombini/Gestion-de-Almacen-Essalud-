<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /**
     * Listado de pacientes (principalmente para PADOMI).
     */
    public function index()
    {
        return response()->json(Patient::with('location')->get());
    }

    /**
     * Registrar un nuevo paciente.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dni' => 'required|string|max:8|unique:patients',
            'patient_code' => 'nullable|string|max:50',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'loan_expiration_date' => 'nullable|date',
        ]);

        $patient = Patient::create($validated);

        return response()->json([
            'message' => 'Paciente registrado correctamente',
            'data' => $patient
        ], 201);
    }

    /**
     * Buscar paciente por DNI.
     */
    public function show($dni)
    {
        $patient = Patient::where('dni', $dni)->with('location')->firstOrFail();
        return response()->json($patient);
    }

    /**
     * Actualizar datos del paciente.
     */
    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'dni' => 'sometimes|required|string|max:8|unique:patients,dni,'.$id,
            'patient_code' => 'nullable|string|max:50',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'loan_expiration_date' => 'nullable|date',
        ]);

        $patient->update($validated);

        return response()->json([
            'message' => 'Paciente actualizado correctamente',
            'data' => $patient
        ]);
    }
}
