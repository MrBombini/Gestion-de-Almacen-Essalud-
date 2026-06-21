<?php

namespace App\Http\Controllers;

use App\Models\Cylinder;
use Illuminate\Http\Request;

class CylinderController extends Controller
{
    public function index(Request $request)
    {
        $query = Cylinder::with(['supplier', 'ownershipType', 'patient', 'currentPatient', 'currentService', 'currentBed'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('serial_number', 'like', '%' . $search . '%')
                  ->orWhere('barcode', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('location') && $request->location !== 'ALL') {
            $query->where('location', $request->location);
        }

        if ($request->has('supplier_id') && $request->supplier_id !== '') {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('ownership_type_id') && $request->ownership_type_id !== '') {
            $query->where('ownership_type_id', $request->ownership_type_id);
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 20);
        
        if ($perPage === 'all') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate((int)$perPage));
    }

    private function normalizeCylinderData(Request $request): void
    {
        if ($request->has('status')) {
            $status = strtolower(trim($request->status));
            $statusMap = [
                'lleno' => 'full',
                'vacío' => 'empty',
                'vacio' => 'empty',
                'en uso' => 'in_use',
                'en transito' => 'in_transit',
                'en tránsito' => 'in_transit',
                'perdido' => 'lost',
                'extraviado' => 'lost',
            ];
            $request->merge(['status' => $statusMap[$status] ?? $status]);
        }

        if ($request->has('location')) {
            $location = strtoupper(trim($request->location));
            $locationMap = [
                'HOSPITALIZACIÓN' => 'HOSPITALIZACION',
                'ALMACÉN' => 'ALMACEN',
            ];
            $request->merge(['location' => $locationMap[$location] ?? $location]);
        }
    }

    public function store(Request $request)
    {
        $this->normalizeCylinderData($request);

        $validated = $request->validate([
            'serial_number'         => 'required|string|unique:cylinders,serial_number',
            'barcode'               => 'nullable|string|unique:cylinders,barcode',
            'supplier_id'          => 'required|exists:suppliers,id',
            'ownership_type_id'     => 'required|exists:ownership_types,id',
            'patient_id'            => 'nullable|exists:patients,id',
            'service_id'            => 'nullable|exists:services,id',
            'gas_type'              => 'required|string',
            'capacity'              => 'required|numeric',
            'status'                => 'required|string|in:full,empty,in_use,lost,in_transit',
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

        $this->normalizeCylinderData($request);

        $validated = $request->validate([
            'serial_number'         => 'required|string|unique:cylinders,serial_number,' . $id,
            'barcode'               => 'nullable|string|unique:cylinders,barcode,' . $id,
            'supplier_id'          => 'required|exists:suppliers,id',
            'ownership_type_id'     => 'required|exists:ownership_types,id',
            'patient_id'            => 'nullable|exists:patients,id',
            'service_id'            => 'nullable|exists:services,id',
            'gas_type'              => 'required|string',
            'capacity'              => 'required|numeric',
            'status'                => 'required|string|in:full,empty,in_use,lost,in_transit',
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
