<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::all());
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
}
