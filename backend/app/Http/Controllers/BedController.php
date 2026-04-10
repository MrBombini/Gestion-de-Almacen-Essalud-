<?php

namespace App\Http\Controllers;

use App\Models\Bed;
use Illuminate\Http\Request;

class BedController extends Controller
{
    public function index()
    {
        return response()->json(Bed::with('service')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'bed_number' => 'required|string|max:20',
            'status'     => 'required|string|in:available,occupied',
        ]);

        $bed = Bed::create($validated);
        return response()->json($bed, 201);
    }
}
