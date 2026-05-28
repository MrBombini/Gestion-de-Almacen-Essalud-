<?php
 
namespace App\Http\Controllers;
 
use App\Models\Cylinder;
use App\Models\CylinderMovement;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Decanting;

class ReportController extends Controller
{
    /**
     * REPORTE 1: KARDEX ATENCIÓN DE OXÍGENO (Profesional)
     * Este es el reporte principal solicitado basado en el formato físico.
     */
    public function dailyKardex(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        
        // 1. Saldo Inicial / Stock Actual por Propietario (Garantizando que aparezcan todos los tipos)
        $ownershipTypes = DB::table('ownership_types')->get();
        $counts = DB::table('cylinders')
            ->select('ownership_type_id', 'status', DB::raw('count(*) as total'))
            ->where('location', 'CENTRAL')
            ->groupBy('ownership_type_id', 'status')
            ->get();

        $stockSummary = $ownershipTypes->map(function($type) use ($counts) {
            return [
                'name' => $type->name,
                'full' => $counts->where('ownership_type_id', $type->id)->where('status', 'full')->first()->total ?? 0,
                'empty' => $counts->where('ownership_type_id', $type->id)->where('status', 'empty')->first()->total ?? 0,
            ];
        });

        // 2. Saldo Inicial Detallado (Para lógica de celdas)
        $initialBalance = Cylinder::where('location', 'CENTRAL')
            ->select('capacity', 'status', 'ownership_type_id', DB::raw('count(*) as total'))
            ->groupBy('capacity', 'status', 'ownership_type_id')
            ->get();
            
        // 3. Movimientos del día agrupados por turno
        $allMovements = InventoryMovement::with([
                'cylinderMovements.cylinder.ownershipType', 
                'patient', 
                'service', 
                'user',
                'bed'
            ])
            ->whereDate('movement_at', $date)
            ->orderBy('movement_at', 'asc')
            ->get();

        $shifts = $allMovements->groupBy('shift');

        // Formatear respuesta por turnos (Mañana, Tarde, Noche)
        $formattedShifts = [];
        foreach (['Morning' => 'MAÑANA', 'Afternoon' => 'TARDE', 'Night' => 'NOCHE'] as $key => $display) {
            $shiftMovements = $shifts->get($key, collect());
            $operators = $shiftMovements->pluck('user.name')->unique()->filter()->values();
            
            $formattedShifts[$display] = [
                'movements' => $shiftMovements,
                'operators' => $operators
            ];
        }

        return response()->json([
            'date' => $date,
            'stock_summary' => $stockSummary,
            'initial_balance' => $initialBalance,
            'shifts' => $formattedShifts,
            'note' => 'El saldo inicial detallado y por propietario muestra una captura en tiempo real del estado actual del almacén.'
        ]);
    }

    /**
     * REPORTE 2: REGISTRO DE CONSUMO DE OXÍGENO DIARIO
     * Panel consolidado de m3 entregados y estado de la reserva.
     */
    public function dailyConsumptionDashboard(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());

        // 1. Consumo por Turno y Categoría
        $movements = InventoryMovement::whereDate('movement_at', $date)
            ->with(['cylinderMovements.cylinder', 'user'])
            ->get();

        $shifts = ['Morning' => 'MAÑANA', 'Afternoon' => 'TARDE', 'Night' => 'NOCHE'];
        $shiftData = [];
        $grandTotal = 0;

        foreach ($shifts as $key => $name) {
            $shiftMoves = $movements->where('shift', $key);
            
            $padomi = 0;
            $hnagv = 0;
            $perifericos = 0;

            foreach ($shiftMoves as $move) {
                $m3 = $move->cylinderMovements->where('action', 'Exit')->sum(fn($cm) => $cm->cylinder->capacity);
                
                if ($move->patient_id) $padomi += $m3;
                elseif ($move->service_id && $move->type !== 'ServiceBulkExchange') $hnagv += $m3;
                elseif ($move->type === 'ServiceBulkExchange') $perifericos += $m3;
            }

            $totalShift = $padomi + $hnagv + $perifericos;
            $grandTotal += $totalShift;

            $shiftData[$name] = [
                'padomi' => $padomi,
                'hnagv' => $hnagv,
                'perifericos' => $perifericos,
                'total' => $totalShift,
                'operators' => $shiftMoves->pluck('user.name')->unique()->filter()->values()
            ];
        }

        // 2. Estado de Reserva (Cilindros LLENOS por ubicación)
        $fullStock = Cylinder::where('status', 'full')
            ->select('location', 'capacity', 'ownership_type_id', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id')
            ->get();

        // 3. Estado de Almacén (Cilindros VACÍOS por ubicación)
        $emptyStock = Cylinder::where('status', 'empty')
            ->select('location', 'capacity', 'ownership_type_id', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id')
            ->get();

        return response()->json([
            'date' => $date,
            'shifts' => $shiftData,
            'grand_total' => $grandTotal,
            'reserva_llenos' => $fullStock,
            'almacen_vacios' => $emptyStock,
            'resumen_final' => [
                'total_ingreso' => InventoryMovement::whereDate('movement_at', $date)
                    ->whereIn('type', ['SupplierEntry', 'SupplierMovement'])
                    ->join('cylinder_movements', 'inventory_movements.id', '=', 'cylinder_movements.inventory_movement_id')
                    ->where('cylinder_movements.action', 'Entry')
                    ->count()
            ]
        ]);
    }

    /**
     * Reporte Auxiliar: Kardex General (Listado simple)
     */
    public function kardexGeneral(Request $request)
    {
        $perPage = $request->query('per_page', 100);
        $kardex = InventoryMovement::with(['user', 'patient', 'service', 'cylinderMovements.cylinder'])
            ->orderBy('movement_at', 'desc')
            ->paginate($perPage);
                           
        return response()->json($kardex);
    }
}
