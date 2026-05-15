<?php

namespace App\Http\Controllers;

use App\Models\DailyReading;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DailyReadingController extends Controller
{
    public function index()
    {
        return response()->json(DailyReading::with('user')->orderBy('reading_date', 'desc')->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reading_date'       => 'required|date',
            'shift'              => 'required|string|in:Morning,Afternoon,Night',
            'tank_level'         => 'required|numeric|min:0|max:100',
            'flow_meter_reading' => 'required|numeric|min:0',
        ]);

        $lastReading = DailyReading::orderBy('id', 'desc')->first();
        $calculatedConsumption = 0;
        
        if ($lastReading) {
            $diff = $validated['flow_meter_reading'] - $lastReading->flow_meter_reading;
            $calculatedConsumption = $diff > 0 ? $diff : 0;
        }

        $reading = DailyReading::create(array_merge($validated, [
            'user_id'                => Auth::id(),
            'calculated_consumption' => $calculatedConsumption,
        ]));

        return response()->json($reading->load('user'), 201);
    }

    public function update(Request $request, $id)
    {
        $reading = DailyReading::findOrFail($id);

        $validated = $request->validate([
            'reading_date'       => 'required|date',
            'shift'              => 'required|string|in:Morning,Afternoon,Night',
            'tank_level'         => 'required|numeric|min:0|max:100',
            'flow_meter_reading' => 'required|numeric|min:0',
        ]);

        // Recalcular consumo comparando con la lectura anterior (la inmediatamente antes por ID)
        $prevReading = DailyReading::where('id', '<', $id)->orderBy('id', 'desc')->first();
        $calculatedConsumption = 0;

        if ($prevReading) {
            $diff = $validated['flow_meter_reading'] - $prevReading->flow_meter_reading;
            $calculatedConsumption = $diff > 0 ? $diff : 0;
        }

        $reading->update(array_merge($validated, [
            'calculated_consumption' => $calculatedConsumption,
        ]));

        return response()->json($reading->load('user'));
    }

    public function destroy($id)
    {
        $reading = DailyReading::findOrFail($id);
        $reading->delete();
        return response()->json(['message' => 'Lectura eliminada correctamente.']);
    }
}

