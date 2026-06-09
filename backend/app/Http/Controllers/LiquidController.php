<?php

namespace App\Http\Controllers;

use App\Models\LiquidRefill;
use App\Models\DailyReading;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LiquidController extends Controller
{
    public function index()
    {
        $refills = LiquidRefill::with(['supplier', 'user'])
            ->orderBy('refilled_at', 'desc')
            ->get();
        return response()->json($refills);
    }

    public function storeRefill(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'        => 'required|exists:suppliers,id',
            'level_before'       => 'required|numeric|min:0',
            'level_after'        => 'required|numeric|min:0',
            'weight_before'      => 'required|numeric|min:0',
            'weight_after'       => 'required|numeric|min:0',
            'ticket_amount'      => 'nullable|numeric|min:0',
            'reference_document' => 'nullable|string',
            'refilled_at'        => 'required|date',
        ]);

        $refill = LiquidRefill::create([
            'supplier_id'        => $validated['supplier_id'],
            'level_before'       => $validated['level_before'],
            'level_after'        => $validated['level_after'],
            'weight_before'      => $validated['weight_before'],
            'weight_after'       => $validated['weight_after'],
            'ticket_amount'      => $validated['ticket_amount'] ?? null,
            'reference_document' => $validated['reference_document'] ?? null,
            'refilled_at'        => $validated['refilled_at'],
            'user_id'            => Auth::id(),
        ]);

        return response()->json($refill->load(['supplier', 'user']), 201);
    }

    public function destroy($id)
    {
        $refill = LiquidRefill::findOrFail($id);
        $refill->delete();
        return response()->json(['message' => 'Recarga de oxígeno líquido eliminada correctamente.']);
    }
}
