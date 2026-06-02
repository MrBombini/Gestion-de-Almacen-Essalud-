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
                'cylinderMovements.cylinder.supplier',
                'patient', 
                'service', 
                'user',
                'bed',
                'supplier'
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
        $kardex = InventoryMovement::with([
                'user',
                'patient',
                'service',
                'bed',
                'supplier',
                'cylinderMovements.cylinder.ownershipType',
                'cylinderMovements.cylinder.supplier'
            ])
            ->orderBy('movement_at', 'desc')
            ->paginate($perPage);
                           
        return response()->json($kardex);
    }

    /**
     * Estadísticas dinámicas del Dashboard para el operario/administrador.
     */
    public function dashboardStats()
    {
        // 1. Balones Llenos en la CENTRAL
        $fullCentralCount = Cylinder::where('status', 'full')
            ->where('location', 'CENTRAL')
            ->count();

        // 2. Balones Vacíos en la CENTRAL
        $emptyCentralCount = Cylinder::where('status', 'empty')
            ->where('location', 'CENTRAL')
            ->count();

        // 3. Nivel de Tanque Criogénico (última lectura registrada)
        $latestReading = \App\Models\DailyReading::orderBy('reading_date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $tankLevel = $latestReading ? (float) $latestReading->tank_level : 0;
        $lastReadingTime = $latestReading ? $latestReading->created_at->diffForHumans() : 'Sin registros';

        return response()->json([
            'full_central_count' => $fullCentralCount,
            'empty_central_count' => $emptyCentralCount,
            'tank_level' => $tankLevel,
            'last_reading_time' => $lastReadingTime,
        ]);
    }

    /**
     * REPORTE: Inventario consolidado agrupado
     */
    public function inventoryReport()
    {
        $summary = Cylinder::select('location', 'status', 'ownership_type_id', DB::raw('count(*) as total'), DB::raw('sum(capacity) as total_capacity'))
            ->groupBy('location', 'status', 'ownership_type_id')
            ->with('ownershipType')
            ->get();
        
        return response()->json($summary);
    }

    /**
     * REPORTE: Balones estancados (sin movimientos en los últimos N días)
     */
    public function stagnantCylinders(Request $request)
    {
        $days = (int) $request->query('days', 15);
        $dateLimit = Carbon::now()->subDays($days);

        $cylinders = Cylinder::with(['ownershipType', 'currentPatient', 'currentService'])
            ->leftJoin('cylinder_movements', 'cylinders.id', '=', 'cylinder_movements.cylinder_id')
            ->leftJoin('inventory_movements', 'cylinder_movements.inventory_movement_id', '=', 'inventory_movements.id')
            ->select('cylinders.*', DB::raw('MAX(inventory_movements.movement_at) as last_movement_at'))
            ->groupBy(
                'cylinders.id',
                'cylinders.serial_number',
                'cylinders.barcode',
                'cylinders.supplier_id',
                'cylinders.ownership_type_id',
                'cylinders.patient_id',
                'cylinders.service_id',
                'cylinders.current_patient_id',
                'cylinders.current_service_id',
                'cylinders.current_bed_id',
                'cylinders.gas_type',
                'cylinders.capacity',
                'cylinders.status',
                'cylinders.location',
                'cylinders.hydrostatic_test_date',
                'cylinders.physical_condition',
                'cylinders.created_at',
                'cylinders.updated_at',
                'cylinders.deleted_at'
            )
            ->havingRaw('last_movement_at IS NULL AND cylinders.created_at <= ?', [$dateLimit])
            ->orHaving('last_movement_at', '<=', $dateLimit)
            ->orderBy('last_movement_at', 'asc')
            ->get();

        return response()->json($cylinders);
    }

    /**
     * REPORTE: Historial/Seguimiento de un cilindro específico
     */
    public function cylinderHistory($id)
    {
        $cylinder = Cylinder::with(['supplier', 'ownershipType', 'currentPatient', 'currentService', 'currentBed'])->findOrFail($id);

        // 1. Obtener movimientos generales de inventario
        $movements = CylinderMovement::with(['inventoryMovement.user', 'inventoryMovement.patient', 'inventoryMovement.service', 'inventoryMovement.supplier'])
            ->where('cylinder_id', $id)
            ->get()
            ->map(function ($m) {
                return [
                    'type' => 'movement',
                    'event_type' => $m->inventoryMovement->type,
                    'action' => $m->action,
                    'date' => $m->inventoryMovement->movement_at,
                    'shift' => $m->inventoryMovement->shift,
                    'status' => $m->cylinder_status,
                    'user' => $m->inventoryMovement->user?->name,
                    'destination' => $m->inventoryMovement->patient?->full_name 
                        ?? $m->inventoryMovement->service?->name 
                        ?? $m->inventoryMovement->supplier?->name 
                        ?? 'Almacén Central',
                    'document' => $m->inventoryMovement->reference_document,
                    'notes' => $m->inventoryMovement->notes,
                ];
            });

        // 2. Obtener trasiegos (Decantings)
        $decantings = Decanting::with(['user', 'patient', 'service'])
            ->where('cylinder_id', $id)
            ->get()
            ->map(function ($d) {
                return [
                    'type' => 'decanting',
                    'event_type' => 'Trasiego',
                    'action' => 'Entry',
                    'date' => $d->decanted_at,
                    'shift' => $d->shift,
                    'status' => 'full (refilled)',
                    'user' => $d->user?->name,
                    'destination' => $d->patient?->full_name 
                        ?? $d->service?->name 
                        ?? $d->manual_destination 
                        ?? 'Estación de Trasiego',
                    'document' => 'Cantidad: ' . $d->refilled_amount . ' m³',
                    'notes' => 'Recarga de balón en cascada/trasiego.',
                ];
            });

        // 3. Combinar y ordenar cronológicamente
        $history = $movements->concat($decantings)->sortByDesc('date')->values();

        return response()->json([
            'cylinder' => $cylinder,
            'history' => $history
        ]);
    }

    /**
     * REPORTE: Cierre de Turno
     */
    public function shiftClosure(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        $shift = $request->query('shift', 'Morning');

        $movements = InventoryMovement::with(['user', 'patient', 'service', 'supplier', 'cylinderMovements.cylinder'])
            ->whereDate('movement_at', $date)
            ->where('shift', $shift)
            ->get();

        $decantings = Decanting::with(['user', 'patient', 'service', 'cylinder'])
            ->whereDate('decanted_at', $date)
            ->where('shift', $shift)
            ->get();

        $readings = \App\Models\DailyReading::with('user')
            ->whereDate('reading_date', $date)
            ->where('shift', $shift)
            ->get();

        return response()->json([
            'date' => $date,
            'shift' => $shift,
            'movements_count' => $movements->count(),
            'movements' => $movements,
            'decantings_count' => $decantings->count(),
            'decantings' => $decantings,
            'readings' => $readings,
        ]);
    }

    /**
     * REPORTE: Consumo en rango de fechas
     */
    public function consumptionReport(Request $request)
    {
        $startDate = $request->query('start_date', Carbon::today()->subDays(7)->toDateString());
        $endDate = $request->query('end_date', Carbon::today()->toDateString());

        $tankConsumption = \App\Models\DailyReading::whereBetween('reading_date', [$startDate, $endDate])
            ->orderBy('reading_date', 'asc')
            ->get();

        $movements = InventoryMovement::whereBetween('movement_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->with(['cylinderMovements.cylinder', 'service'])
            ->get();

        $cylinderConsumption = [
            'PADOMI' => 0,
            'HOSPITALIZACION' => 0,
            'PERIFERIA' => 0,
            'MANIFOLD' => 0,
        ];

        foreach ($movements as $mov) {
            $volume = $mov->cylinderMovements->where('action', 'Exit')->sum(function ($cm) {
                return (float) $cm->cylinder?->capacity;
            });

            if ($mov->patient_id) {
                $cylinderConsumption['PADOMI'] += $volume;
            } elseif ($mov->service_id) {
                if ($mov->type === 'ServiceBulkExchange') {
                    $cylinderConsumption['PERIFERIA'] += $volume;
                } else {
                    $serviceType = strtolower($mov->service->type ?? '');
                    if (str_contains($serviceType, 'manifold')) {
                        $cylinderConsumption['MANIFOLD'] += $volume;
                    } else {
                        $cylinderConsumption['HOSPITALIZACION'] += $volume;
                    }
                }
            }
        }

        return response()->json([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'tank_readings' => $tankConsumption,
            'cylinder_consumption' => $cylinderConsumption,
        ]);
    }
}
