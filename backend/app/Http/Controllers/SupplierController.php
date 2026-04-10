<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json(Supplier::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:suppliers,name',
            'description' => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json($supplier, 201);
    }

    public function show($id)
    {
        return response()->json(Supplier::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:suppliers,name,' . $id,
            'description' => 'nullable|string',
        ]);

        $supplier->update($validated);
        return response()->json($supplier);
    }
}
