<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InventoryMovement;

class ReportController extends Controller
{
    public function kardexGeneral()
    {
        // General report of all movements
        $kardex = InventoryMovement::with(['user', 'patient', 'service', 'cylinderMovements.cylinder'])
            ->orderBy('movement_at', 'desc')
            ->get();
                           
        return response()->json($kardex);
    }

    public function dailyConsumptionSummary()
    {
        // Logic to return the dynamic state of oxygen inventory
        return response()->json(['message' => 'General report summary']);
    }
}
