<?php

namespace App\Http\Controllers;

use App\Models\Cylinder;
use Illuminate\Http\Request;

class CylinderController extends Controller
{
    public function index()
    {
        return response()->json(Cylinder::with(['supplier', 'ownershipType'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'serial_number'     => 'required|string|unique:cylinders,serial_number',
            'supplier_id'      => 'required|exists:suppliers,id',
            'ownership_type_id' => 'required|exists:ownership_types,id',
            'gas_type'          => 'required|string',
            'capacity'          => 'required|numeric',
            'status'            => 'required|string|in:full,empty,in_use,lost',
        ]);

        $cylinder = Cylinder::create($validated);
        return response()->json($cylinder, 201);
    }
}
