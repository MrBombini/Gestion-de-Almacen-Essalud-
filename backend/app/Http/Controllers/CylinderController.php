<?php

namespace App\Http\Controllers;

use App\Models\Cylinder;
use Illuminate\Http\Request;

class CylinderController extends Controller
{
    public function index(Request $request)
    {
        $query = Cylinder::with(['supplier', 'ownershipType', 'patient.prescriptions', 'currentPatient.prescriptions', 'currentService', 'currentBed'])
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

        if ($request->filled('supplier_id') && $request->supplier_id !== 'ALL' && $request->supplier_id !== 'null') {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('ownership_type_id') && $request->ownership_type_id !== 'ALL' && $request->ownership_type_id !== 'null') {
            $query->where('ownership_type_id', $request->ownership_type_id);
        }

        if ($request->filled('status') && $request->status !== 'ALL' && $request->status !== 'null') {
            $query->where('status', $request->status);
        }

        if ($request->filled('current_service_id') && $request->current_service_id !== 'ALL' && $request->current_service_id !== 'null') {
            $query->where('current_service_id', $request->current_service_id);
        }

        // Filtro por paciente asignado actualmente (para devolucion PADOMI)
        if ($request->filled('patient_id') && $request->patient_id !== 'ALL' && $request->patient_id !== 'null') {
            $query->where('current_patient_id', $request->patient_id);
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
                'PERIFERIE' => 'PERIFERIE/CENTROS MEDICOS',
                'PERIFERIA' => 'PERIFERIE/CENTROS MEDICOS',
                'CENTROS MEDICOS' => 'PERIFERIE/CENTROS MEDICOS',
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
            'location'              => 'required|string|in:CENTRAL,HOSPITALIZACION,PADOMI,ALMACEN,PROVEEDOR,PERIFERIE/CENTROS MEDICOS',
            'hydrostatic_test_date' => 'nullable|date',
            'physical_condition'    => 'nullable|string',
            'current_service_id'    => 'nullable|exists:services,id',
            'current_bed_id'        => 'nullable|exists:beds,id',
            'current_patient_id'    => 'nullable|exists:patients,id',
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
            'location'              => 'required|string|in:CENTRAL,HOSPITALIZACION,PADOMI,ALMACEN,PROVEEDOR,PERIFERIE/CENTROS MEDICOS',
            'hydrostatic_test_date' => 'nullable|date',
            'physical_condition'    => 'nullable|string',
            'current_service_id'    => 'nullable|exists:services,id',
            'current_bed_id'        => 'nullable|exists:beds,id',
            'current_patient_id'    => 'nullable|exists:patients,id',
        ]);

        $cylinder->update($validated);
        return response()->json($cylinder->load(['supplier', 'ownershipType', 'patient']));
    }

    public function destroy($id)
    {
        $cylinder = Cylinder::findOrFail($id);
        
        // Remove from active stock locations by changing status and location
        $cylinder->update([
            'status' => 'lost',
            'location' => 'DELETED'
        ]);

        $cylinder->delete();
        return response()->json(['message' => 'Cylinder deleted successfully.']);
    }
}
