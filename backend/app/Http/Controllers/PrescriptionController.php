<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    public function index()
    {
        $prescriptions = Prescription::with(['patient', 'service'])
            ->orderBy('id', 'desc')
            ->get();
        return response()->json($prescriptions);
    }

    public function show($id)
    {
        $prescription = Prescription::with(['patient', 'service'])->findOrFail($id);
        return response()->json($prescription);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'         => 'required|exists:patients,id',
            'dosage'             => 'nullable|string|max:100',
            'usage_time'         => 'nullable|string|max:50',
            'authorization_date' => 'required|date',
            'expires_at'         => 'required|date',
            'promissory_note'    => 'nullable|string|max:100',
            'status'             => 'nullable|string|in:active,expired,inactive',
        ]);

        $status = $validated['status'] ?? 'active';

        $prescription = Prescription::create(array_merge($validated, [
            'service_id' => null,
            'issued_at'  => $validated['authorization_date'],
            'status'     => $status,
        ]));

        return response()->json($prescription->load(['patient', 'service']), 201);
    }

    public function update(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);

        $validated = $request->validate([
            'dosage'             => 'nullable|string|max:100',
            'usage_time'         => 'nullable|string|max:50',
            'authorization_date' => 'required|date',
            'expires_at'         => 'required|date',
            'promissory_note'    => 'nullable|string|max:100',
            'status'             => 'nullable|string|in:active,expired,inactive',
        ]);

        $validated['issued_at'] = $validated['authorization_date'];

        $prescription->update($validated);
        return response()->json($prescription->fresh(['patient', 'service']));
    }

    public function destroy($id)
    {
        $prescription = Prescription::findOrFail($id);
        $prescription->delete();
        return response()->json(['message' => 'Receta eliminada correctamente.']);
    }
}
