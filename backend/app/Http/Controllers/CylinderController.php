<?php

namespace App\Http\Controllers;

use App\Models\Cylinder;
use Illuminate\Http\Request;

class CylinderController extends Controller
{
    public function index()
    {
        return response()->json(Cylinder::with(['supplier', 'ownershipType', 'patient', 'currentPatient', 'currentService', 'currentBed'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'serial_number'         => 'required|string|unique:cylinders,serial_number',
            'barcode'               => 'nullable|string|unique:cylinders,barcode',
            'supplier_id'          => 'required|exists:suppliers,id',
            'ownership_type_id'     => 'required|exists:ownership_types,id',
            'patient_id'            => 'nullable|exists:patients,id',
            'service_id'            => 'nullable|exists:services,id',
            'gas_type'              => 'required|string',
            'capacity'              => 'required|numeric',
            'status'                => 'required|string|in:full,empty,in_use,lost',
            'location'              => 'required|string|in:CENTRAL,HOSPITALIZACION,PADOMI,ALMACEN,PROVEEDOR',
            'hydrostatic_test_date' => 'nullable|date',
            'physical_condition'    => 'nullable|string',
        ]);

        $cylinder = Cylinder::create($validated);
        return response()->json($cylinder->load(['supplier', 'ownershipType', 'patient']), 201);
    }

    public function show($id)
    {
        return response()->json(Cylinder::with(['supplier', 'ownershipType', 'patient'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $cylinder = Cylinder::findOrFail($id);

        $validated = $request->validate([
            'serial_number'         => 'required|string|unique:cylinders,serial_number,' . $id,
            'barcode'               => 'nullable|string|unique:cylinders,barcode,' . $id,
            'supplier_id'          => 'required|exists:suppliers,id',
            'ownership_type_id'     => 'required|exists:ownership_types,id',
            'patient_id'            => 'nullable|exists:patients,id',
            'gas_type'              => 'required|string',
            'capacity'              => 'required|numeric',
            'status'                => 'required|string|in:full,empty,in_use,lost',
            'location'              => 'required|string|in:CENTRAL,HOSPITALIZACION,PADOMI,ALMACEN,PROVEEDOR',
            'hydrostatic_test_date' => 'nullable|date',
            'physical_condition'    => 'nullable|string',
        ]);

        $cylinder->update($validated);
        return response()->json($cylinder->load(['supplier', 'ownershipType', 'patient']));
    }

    public function destroy($id)
    {
        $cylinder = Cylinder::findOrFail($id);
        $cylinder->delete();
        return response()->json(['message' => 'Cylinder deleted successfully.']);
    }
}
