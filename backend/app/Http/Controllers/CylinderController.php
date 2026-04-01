<?php

namespace App\Http\Controllers;

use App\Models\Cylinder;
use App\Models\GasType;
use App\Models\Provider;
use App\Models\CylinderCapacity;
use App\Models\CylinderModel;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CylinderController extends Controller
{
    /**
     * Listado general de cilindros con filtros básicos.
     */
    public function index(Request $request)
    {
        $query = Cylinder::with(['gasType', 'capacity', 'provider', 'cylinderModel', 'location']);

        // Filtros opcionales
        if ($request->has('gas_type_id')) {
            $query->where('gas_type_id', $request->gas_type_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('location_id')) {
            $query->where('current_location_id', $request->location_id);
        }
        if ($request->has('provider_id')) {
            $query->where('provider_id', $request->provider_id);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('barcode', 'like', "%{$search}%")
                  ->orWhere('serial_number_stamped', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Datos maestros necesarios para los formularios de cilindros.
     */
    public function getFormOptions()
    {
        return response()->json([
            'gas_types' => GasType::select('id', 'name')->get(),
            'providers' => Provider::select('id', 'company_name')->get(),
            'capacities' => CylinderCapacity::select('id', 'description', 'value', 'unit')->get(),
            'models' => CylinderModel::select('id', 'name')->get(),
            'locations' => Location::select('id', 'service_name', 'identifier')->get(),
            'statuses' => ['Full', 'Empty', 'In Maintenance', 'Damaged', 'Retired'],
            'asset_types' => ['Cylinder', 'Vat/Thermos']
        ]);
    }

    /**
     * Registrar un nuevo balón físico en el sistema.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string|max:50|unique:cylinders',
            'serial_number_stamped' => 'nullable|string|max:100',
            'gas_type_id' => 'required|exists:gas_types,id',
            'capacity_id' => 'required|exists:cylinder_capacities,id',
            'provider_id' => 'required|exists:providers,id',
            'cylinder_model_id' => 'nullable|exists:cylinder_models,id',
            'asset_type' => 'required|in:Cylinder,Vat/Thermos',
            'ph_test_date' => 'nullable|date',
            'status' => 'required|in:Full,Empty,In Maintenance,Damaged,Retired',
            'current_location_id' => 'nullable|exists:locations,id',
        ]);

        $cylinder = Cylinder::create($validated);

        return response()->json([
            'message' => 'Balón registrado exitosamente',
            'data' => $cylinder
        ], 201);
    }

    /**
     * Ver detalle de un balón mediante su código de barras.
     */
    public function show($barcode)
    {
        $cylinder = Cylinder::with(['gasType', 'capacity', 'provider', 'cylinderModel', 'location', 'statusLogs'])
            ->findOrFail($barcode);

        return response()->json($cylinder);
    }

    /**
     * Actualizar información básica del cilindro.
     */
    public function update(Request $request, $barcode)
    {
        $cylinder = Cylinder::findOrFail($barcode);

        $validated = $request->validate([
            'serial_number_stamped' => 'nullable|string|max:100',
            'gas_type_id' => 'sometimes|exists:gas_types,id',
            'capacity_id' => 'sometimes|exists:cylinder_capacities,id',
            'provider_id' => 'sometimes|exists:providers,id',
            'cylinder_model_id' => 'nullable|exists:cylinder_models,id',
            'asset_type' => 'sometimes|in:Cylinder,Vat/Thermos',
            'ph_test_date' => 'nullable|date',
            'status' => 'sometimes|in:Full,Empty,In Maintenance,Damaged,Retired',
            'current_location_id' => 'nullable|exists:locations,id',
        ]);

        $cylinder->update($validated);

        return response()->json([
            'message' => 'Cilindro actualizado correctamente',
            'data' => $cylinder
        ]);
    }
}
