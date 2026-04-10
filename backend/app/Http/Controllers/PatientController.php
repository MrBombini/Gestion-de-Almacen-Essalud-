<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index()
    {
        return response()->json(Patient::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'     => 'required|string|max:150',
            'dni'           => 'nullable|string|max:15|unique:patients,dni',
            'trasiego_code' => 'nullable|string|max:20',
            'exchange_code' => 'nullable|string|max:20',
        ]);

        $patient = Patient::create($validated);
        return response()->json($patient, 201);
    }

    public function show($id)
    {
        return response()->json(Patient::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);
        
        $validated = $request->validate([
            'full_name'     => 'required|string|max:150',
            'dni'           => 'nullable|string|max:15|unique:patients,dni,' . $id,
            'trasiego_code' => 'nullable|string|max:20',
            'exchange_code' => 'nullable|string|max:20',
        ]);

        $patient->update($validated);
        return response()->json($patient);
    }

    public function destroy($id)
    {
        $patient = Patient::findOrFail($id);
        $patient->delete();
        return response()->json(['message' => 'Patient deleted successfully.']);
    }
}
