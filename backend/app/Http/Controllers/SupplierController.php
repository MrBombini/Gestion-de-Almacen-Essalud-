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
            'name'        => 'required|string|max:100|unique:suppliers,name',
            'ruc'         => 'nullable|string|max:11|unique:suppliers,ruc',
            'address'     => 'nullable|string|max:255',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:100',
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
            'name'        => 'required|string|max:100|unique:suppliers,name,' . $id,
            'ruc'         => 'nullable|string|max:11|unique:suppliers,ruc,' . $id,
            'address'     => 'nullable|string|max:255',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:100',
            'description' => 'nullable|string',
        ]);

        $supplier->update($validated);
        return response()->json($supplier);
    }

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        
        if ($supplier->cylinders()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar el proveedor porque tiene balones asociados.'], 422);
        }

        $supplier->delete();
        return response()->json(['message' => 'Proveedor eliminado correctamente.']);
    }
}
