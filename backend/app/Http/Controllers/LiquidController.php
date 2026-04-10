<?php

namespace App\Http\Controllers;

use App\Models\LiquidRefill;
use App\Models\DailyReading;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LiquidController extends Controller
{
    public function storeRefill(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'        => 'required|exists:suppliers,id',
            'level_before'       => 'required|numeric|min:0',
            'level_after'        => 'required|numeric|min:0',
            'ticket_amount'      => 'nullable|numeric|min:0',
            'reference_document' => 'nullable|string',
            'refilled_at'        => 'required|date',
        ]);

        $refill = LiquidRefill::create([
            'supplier_id'        => $validated['supplier_id'],
            'level_before'       => $validated['level_before'],
            'level_after'        => $validated['level_after'],
            'ticket_amount'      => $validated['ticket_amount'] ?? null,
            'reference_document' => $validated['reference_document'] ?? null,
            'refilled_at'        => $validated['refilled_at'],
            'user_id'            => Auth::id(),
        ]);

        return response()->json($refill, 201);
    }

    public function storeDailyReading(Request $request)
    {
        $validated = $request->validate([
            'ext_tank_reserve'          => 'required|numeric',
            'int_warehouse_consumption' => 'required|numeric',
            'calculated_consumption'    => 'required|numeric',
            'reading_date'              => 'required|date',
            'shift'                     => 'required|string|in:Morning,Afternoon,Night',
        ]);

        $reading = DailyReading::create([
            'ext_tank_reserve'          => $validated['ext_tank_reserve'],
            'int_warehouse_consumption' => $validated['int_warehouse_consumption'],
            'calculated_consumption'    => $validated['calculated_consumption'],
            'reading_date'              => $validated['reading_date'],
            'shift'                     => $validated['shift'],
            'user_id'                   => Auth::id(),
        ]);

        return response()->json($reading, 201);
    }
}
