<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'         => 'required|exists:patients,id',
            'dosage'             => 'required|string|max:100',
            'usage_time'         => 'nullable|string|max:50',
            'expires_at'         => 'nullable|date',
            'authorization_date' => 'nullable|date',
            'promissory_note'    => 'nullable|string|max:100',
            'status'             => 'required|string|in:active,expired,inactive',
        ]);

        $prescription = Prescription::create(array_merge($validated, [
            'service_id' => null,
            'issued_at'  => now(),
        ]));

        return response()->json($prescription, 201);
    }

    public function update(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);

        $validated = $request->validate([
            'dosage'             => 'required|string|max:100',
            'usage_time'         => 'nullable|string|max:50',
            'expires_at'         => 'nullable|date',
            'authorization_date' => 'nullable|date',
            'promissory_note'    => 'nullable|string|max:100',
            'status'             => 'required|string|in:active,expired,inactive',
        ]);

        $prescription->update($validated);
        return response()->json($prescription->fresh());
    }

    public function destroy($id)
    {
        $prescription = Prescription::findOrFail($id);
        $prescription->delete();
        return response()->json(['message' => 'Receta eliminada correctamente.']);
    }
}
