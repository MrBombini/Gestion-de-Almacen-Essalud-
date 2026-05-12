<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::with('beds')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:services,name',
            'type' => 'required|string|max:50',
        ]);

        $service = Service::create($validated);
        return response()->json($service, 201);
    }

    public function show($id)
    {
        return response()->json(Service::with('beds')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:services,name,' . $id,
            'type' => 'required|string|max:50',
        ]);

        $service->update($validated);
        return response()->json($service);
    }

    public function destroy($id)
    {
        $service = Service::findOrFail($id);
        
        if ($service->beds()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar: el servicio tiene ' . $service->beds()->count() . ' cama(s) asociada(s).'], 422);
        }

        // Verificar cilindros asignados
        if ($service->cylinders()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar: el servicio tiene ' . $service->cylinders()->count() . ' cilindro(s) asignado(s).'], 422);
        }

        $service->delete();
        return response()->json(['message' => 'Servicio eliminado correctamente.']);
    }
}
