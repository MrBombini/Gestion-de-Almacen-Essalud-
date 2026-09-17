<?php
 
namespace App\Http\Controllers;
 
use App\Models\Cylinder;
use App\Models\CylinderMovement;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Decanting;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportController extends Controller
{
    /**
     * Aplica un cambio de inventario (+ o -) intentando afectar CENTRAL primero, luego ALMACEN.
     * Si no existe, lo crea en CENTRAL.
     */
    private function applyInventoryChange(&$map, $cap, $own, $sup, $cyl, $delta, $preferredLocation = 'CENTRAL', $fallbackLocation = 'ALMACEN')
    {
        $keyPref = "{$preferredLocation}|{$cap}|{$own}|{$sup}";
        $keyFall = "{$fallbackLocation}|{$cap}|{$own}|{$sup}";

        if ($delta > 0) {
            // Añadir: siempre añadir a la preferida
            if (!isset($map[$keyPref])) {
                $map[$keyPref] = [
                    'location' => $preferredLocation, 'capacity' => $cap, 'ownership_type_id' => $own,
                    'supplier_id' => $sup, 'ownership_type' => $cyl->ownershipType, 'supplier' => $cyl->supplier, 'total' => 0
                ];
            }
            $map[$keyPref]['total'] += $delta;
        } elseif ($delta < 0) {
            // Restar: intentar primero en la preferida, si no hay suficiente, intentar en el fallback
            if (isset($map[$keyPref]) && $map[$keyPref]['total'] > 0) {
                $map[$keyPref]['total'] += $delta; // $delta es negativo
            } elseif (isset($map[$keyFall]) && $map[$keyFall]['total'] > 0) {
                $map[$keyFall]['total'] += $delta;
            } else {
                // BUG FIX: Anteriormente había una "Búsqueda flexible" que buscaba CUALQUIER registro 
                // con la misma capacidad si la llave exacta no tenía stock. Eso causaba que si el stock
                // de Praxair era 0, se le restara a Essalud, descuadrando otra marca.
                // Ahora, SIEMPRE se resta de su propia llave (aunque quede en negativo temporalmente),
                // para que el descuadre sea evidente en la marca correcta.
                $found = false;

                // Si ninguno tiene (stock agotado físicamente o no registrado), forzar negativo en la preferida
                if (!$found) {
                    if (!isset($map[$keyPref])) {
                        $map[$keyPref] = [
                            'location' => $preferredLocation, 'capacity' => $cap, 'ownership_type_id' => $own,
                            'supplier_id' => $sup, 'ownership_type' => $cyl->ownershipType, 'supplier' => $cyl->supplier, 'total' => 0
                        ];
                    }
                    $map[$keyPref]['total'] += $delta;
                }
            }
        }
    }

    /**
     * Reconstruye o recupera el inventario de balones llenos y vacíos a las 07:00 AM de una fecha dada.
     */
    private function getHistoricalInventory($date)
    {
        $targetDate = Carbon::parse($date)->toDateString();
        $isToday = Carbon::parse($targetDate)->isToday();
        $previousDate = Carbon::parse($targetDate)->subDay()->toDateString();
        $startDateTime = Carbon::parse($targetDate)->setTime(7, 0, 0);

        // 1. Intentar obtener snapshot guardado para esa fecha
        $snapshot = \App\Models\DailySnapshot::where('date', $previousDate)->first();
        if (!$snapshot) {
            $snapshot = \App\Models\DailySnapshot::where('date', $targetDate)->first();
        }

        if ($snapshot && !empty($snapshot->snapshot_data['full']) && !empty($snapshot->snapshot_data['empty'])) {
            return [
                'full' => collect($snapshot->snapshot_data['full']),
                'empty' => collect($snapshot->snapshot_data['empty']),
                'from_snapshot' => true,
            ];
        }

        // 2. Si no hay snapshot, obtener stock actual y revertir movimientos
        $currentFull = Cylinder::where('status', 'full')
            ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', 'physical_condition', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id', 'physical_condition')
            ->with(['ownershipType', 'supplier'])
            ->get();

        $currentEmpty = Cylinder::where('status', 'empty')
            ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', 'physical_condition', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id', 'physical_condition')
            ->with(['ownershipType', 'supplier'])
            ->get();

        $movementsSinceDate = CylinderMovement::whereHas('inventoryMovement', function($q) use ($startDateTime) {
                $q->where('movement_at', '>=', $startDateTime);
            })
            ->with(['inventoryMovement', 'cylinder.ownershipType', 'cylinder.supplier'])
            ->get();

        $fullMap = [];
        foreach ($currentFull as $item) {
            $loc = strtoupper($item->location ?? 'CENTRAL');
            $cap = (int) $item->capacity;
            $own = (int) $item->ownership_type_id;
            $sup = (int) ($item->supplier_id ?? 0);
            $key = "{$loc}|{$cap}|{$own}|{$sup}";
            $fullMap[$key] = [
                'location' => $loc,
                'capacity' => $cap,
                'ownership_type_id' => $own,
                'supplier_id' => $item->supplier_id,
                'ownership_type' => $item->ownershipType,
                'supplier' => $item->supplier,
                'total' => (int) $item->total
            ];
        }

        $emptyMap = [];
        foreach ($currentEmpty as $item) {
            $loc = strtoupper($item->location ?? 'CENTRAL');
            $cap = (int) $item->capacity;
            $own = (int) $item->ownership_type_id;
            $sup = (int) ($item->supplier_id ?? 0);
            $key = "{$loc}|{$cap}|{$own}|{$sup}";
            $emptyMap[$key] = [
                'location' => $loc,
                'capacity' => $cap,
                'ownership_type_id' => $own,
                'supplier_id' => $item->supplier_id,
                'ownership_type' => $item->ownershipType,
                'supplier' => $item->supplier,
                'total' => (int) $item->total
            ];
        }

        foreach ($movementsSinceDate as $cm) {
            $cyl = $cm->cylinder;
            if (!$cyl) continue;

            $action = strtolower($cm->action ?? '');
            $status = strtolower($cm->cylinder_status ?? ($action === 'entry' ? 'empty' : 'full'));
            $loc = 'CENTRAL';
            $cap = (int) ($cyl->capacity ?? 10);
            $own = (int) ($cyl->ownership_type_id ?? 0);
            $sup = (int) ($cyl->supplier_id ?? 0);
            $key = "{$loc}|{$cap}|{$own}|{$sup}";

            $isFull = in_array($status, ['full', 'lleno', 'in_use']);
            
            // Si es un traslado interno
            if ($action === 'transfer' && $cm->inventoryMovement) {
                $direction = $cm->inventoryMovement->reference_document;
                // Revertir: 
                // ALMACEN_TO_CENTRAL => originalmente CENTRAL sumó, ALMACEN restó. Para revertir: CENTRAL resta, ALMACEN suma.
                if ($direction === 'ALMACEN_TO_CENTRAL') {
                    if ($isFull) {
                        $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                        $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, 1, 'ALMACEN', 'CENTRAL');
                    } else {
                        $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                        $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, 1, 'ALMACEN', 'CENTRAL');
                    }
                } elseif ($direction === 'CENTRAL_TO_ALMACEN') {
                    if ($isFull) {
                        $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, -1, 'ALMACEN', 'CENTRAL');
                        $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                    } else {
                        $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, -1, 'ALMACEN', 'CENTRAL');
                        $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                    }
                }
                continue;
            }

            if ($isFull) {
                if ($action === 'entry' || $action === 'ingreso') {
                    $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                } elseif ($action === 'exit' || $action === 'salida') {
                    $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                }
            } else {
                if ($action === 'entry' || $action === 'ingreso') {
                    $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                } elseif ($action === 'exit' || $action === 'salida') {
                    $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                }
            }
        }

        foreach ($fullMap as &$f) {
            if ($f['total'] < 0) $f['total'] = 0;
        }
        foreach ($emptyMap as &$e) {
            if ($e['total'] < 0) $e['total'] = 0;
        }

        $fullCollection = collect(array_values($fullMap))->filter(function($item) {
            return in_array($item['location'], ['CENTRAL', 'ALMACEN']);
        })->values();
        $emptyCollection = collect(array_values($emptyMap))->filter(function($item) {
            return in_array($item['location'], ['CENTRAL', 'ALMACEN']);
        })->values();

        if (!$isToday && Carbon::parse($targetDate)->isPast()) {
            \App\Models\DailySnapshot::updateOrCreate(
                ['date' => $previousDate],
                [
                    'snapshot_data' => [
                        'full' => $fullCollection->toArray(),
                        'empty' => $emptyCollection->toArray(),
                        'timestamp' => Carbon::now()->toIso8601String(),
                        'auto_generated' => true
                    ]
                ]
            );
        }

        return [
            'full' => $fullCollection,
            'empty' => $emptyCollection,
            'from_snapshot' => false,
        ];
    }

    /**
     * Aplica los movimientos de un turno a los saldos iniciales del turno.
     */
    private function applyShiftMovementsToStock($fullStock, $emptyStock, $shiftMoves)
    {
        $fullMap = [];
        foreach ($fullStock as $item) {
            $item = (array) $item;
            $loc = strtoupper($item['location'] ?? 'CENTRAL');
            $cap = (int) ($item['capacity'] ?? 10);
            $own = (int) ($item['ownership_type_id'] ?? 0);
            $sup = (int) ($item['supplier_id'] ?? 0);
            $key = "{$loc}|{$cap}|{$own}|{$sup}";
            $fullMap[$key] = $item;
            $fullMap[$key]['total'] = (int) ($item['total'] ?? 0);
        }

        $emptyMap = [];
        foreach ($emptyStock as $item) {
            $item = (array) $item;
            $loc = strtoupper($item['location'] ?? 'CENTRAL');
            $cap = (int) ($item['capacity'] ?? 10);
            $own = (int) ($item['ownership_type_id'] ?? 0);
            $sup = (int) ($item['supplier_id'] ?? 0);
            $key = "{$loc}|{$cap}|{$own}|{$sup}";
            $emptyMap[$key] = $item;
            $emptyMap[$key]['total'] = (int) ($item['total'] ?? 0);
        }

        foreach ($shiftMoves as $move) {
            foreach ($move->cylinderMovements as $cm) {
                $cyl = $cm->cylinder;
                if (!$cyl) continue;

                $action = strtolower($cm->action ?? '');
                $status = strtolower($cm->cylinder_status ?? ($action === 'entry' ? 'empty' : 'full'));
                $loc = 'CENTRAL';
                $cap = (int) ($cyl->capacity ?? 10);
                $own = (int) ($cyl->ownership_type_id ?? 0);
                $sup = (int) ($cyl->supplier_id ?? 0);
                $key = "{$loc}|{$cap}|{$own}|{$sup}";

                // BUG FIX: Si es una salida hacia paciente/servicio/periferia, OBLIGATORIAMENTE asumimos que el balón estaba LLENO al salir
                $isConsumerExit = in_array($move->type ?? '', ['PatientDelivery', 'ServiceDelivery', 'ServiceBulkExchange', 'PeripheryExchange']);
                $isSupplierReturn = in_array($move->type ?? '', ['SupplierReturn']);

                $isFull = in_array($status, ['full', 'lleno', 'in_use']);

                if ($action === 'exit' || $action === 'salida') {
                    if ($isConsumerExit) {
                        $isFull = true;
                    } elseif ($isSupplierReturn) {
                        $isFull = false;
                    }
                }

                if ($action === 'transfer' && $cm->inventoryMovement) {
                    $direction = $cm->inventoryMovement->reference_document;
                    // Aplicar: ALMACEN_TO_CENTRAL => CENTRAL suma 1, ALMACEN resta 1
                    if ($direction === 'ALMACEN_TO_CENTRAL') {
                        if ($isFull) {
                            $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                            $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, -1, 'ALMACEN', 'CENTRAL');
                        } else {
                            $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                            $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, -1, 'ALMACEN', 'CENTRAL');
                        }
                    } elseif ($direction === 'CENTRAL_TO_ALMACEN') {
                        if ($isFull) {
                            $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, 1, 'ALMACEN', 'CENTRAL');
                            $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                        } else {
                            $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, 1, 'ALMACEN', 'CENTRAL');
                            $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                        }
                    }
                    continue;
                }

                if ($isFull) {
                    if ($action === 'entry' || $action === 'ingreso') {
                        $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                    } elseif ($action === 'exit' || $action === 'salida') {
                        $this->applyInventoryChange($fullMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                    }
                } else {
                    if ($action === 'entry' || $action === 'ingreso') {
                        $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, 1, 'CENTRAL', 'ALMACEN');
                    } elseif ($action === 'exit' || $action === 'salida') {
                        $this->applyInventoryChange($emptyMap, $cap, $own, $sup, $cyl, -1, 'CENTRAL', 'ALMACEN');
                    }
                }
            }
        }

        foreach ($fullMap as &$f) {
            if ($f['total'] < 0) $f['total'] = 0;
        }
        foreach ($emptyMap as &$e) {
            if ($e['total'] < 0) $e['total'] = 0;
        }

        return [
            'full' => collect(array_values($fullMap)),
            'empty' => collect(array_values($emptyMap))
        ];
    }

    /**
     * REPORTE 1: KARDEX ATENCIÓN DE OXÍGENO (Matriz Diaria)
     */
    public function dailyKardex(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        
        $historical = $this->getHistoricalInventory($date);
        $full = $historical['full']
            ->filter(function($item) {
                return strtoupper($item['location']) === 'CENTRAL';
            })
            ->map(function($item) {
                $item = (array) $item;
                $item['status'] = 'full';
                return $item;
            });
            
        $empty = $historical['empty']
            ->filter(function($item) {
                return strtoupper($item['location']) === 'CENTRAL';
            })
            ->map(function($item) {
                $item = (array) $item;
                $item['status'] = 'empty';
                return $item;
            });
        $initialBalance = $full->concat($empty)->values();

        $ownershipTypes = DB::table('ownership_types')->get();
        $stockSummary = $ownershipTypes->map(function($type) use ($full, $empty) {
            $fCount = $full->where('ownership_type_id', $type->id)->sum('total');
            $eCount = $empty->where('ownership_type_id', $type->id)->sum('total');
            return [
                'name' => $type->name,
                'full' => $fCount,
                'empty' => $eCount,
            ];
        });
            
        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

        // Movimientos del día agrupados por turno (7am a 7am)
        $allMovements = InventoryMovement::with([
                'cylinderMovements.cylinder.ownershipType', 
                'cylinderMovements.cylinder.supplier',
                'patient', 
                'service', 
                'user',
                'bed',
                'supplier'
            ])
            ->whereBetween('movement_at', [$startDateTime, $endDateTime])
            ->orderBy('movement_at', 'asc')
            ->get();

        $shifts = $allMovements->groupBy('shift');

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
            'used_live_stock' => false,
            'stock_summary' => $stockSummary,
            'initial_balance' => $initialBalance,
            'shifts' => $formattedShifts,
            'note' => 'Saldo inicial histórico exacto a las 07:00 AM.'
        ]);
    }

    /**
     * REPORTE 2: REGISTRO DE CONSUMO DE OXÍGENO DIARIO (Resumen Kardex Cascada)
     */
    public function dailyConsumptionDashboard(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        
        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

        $movements = InventoryMovement::whereBetween('movement_at', [$startDateTime, $endDateTime])
            ->with(['cylinderMovements.cylinder.ownershipType', 'cylinderMovements.cylinder.supplier', 'user', 'patient', 'service'])
            ->get();

        // 1. Obtener inventario exacto a las 07:00 AM para este día
        $historical = $this->getHistoricalInventory($date);
        $currFull = $historical['full'];
        $currEmpty = $historical['empty'];

        // Calcular Saldo Inicial de oxígeno en m3 (Balones llenos en Central y Almacén a las 07:00 AM)
        $initialBalanceM3 = 0;
        foreach ($currFull as $stock) {
            $s = (array) $stock;
            $loc = strtoupper($s['location'] ?? 'CENTRAL');
            if ($loc === 'CENTRAL' || $loc === 'ALMACEN') {
                $initialBalanceM3 += ((float) ($s['capacity'] ?? 10) * (int) ($s['total'] ?? 0));
            }
        }

        $shifts = ['Morning' => 'MAÑANA', 'Afternoon' => 'TARDE', 'Night' => 'NOCHE'];
        $shiftData = [];
        $grandTotalConsumo = 0;
        $grandTotalIngreso = 0;

        foreach ($shifts as $key => $name) {
            $shiftMoves = $movements->where('shift', $key)->values();
            
            $padomi = 0;
            $hnagv = 0;
            $perifericos = 0;
            $totalIngresoShift = 0;

            foreach ($shiftMoves as $move) {
                $m3Exit = $move->cylinderMovements->where('action', 'Exit')->sum(function($cm) {
                    return (float) ($cm->cylinder->capacity ?? 0);
                });
                
                if ($move->patient_id) $padomi += $m3Exit;
                elseif ($move->service_id && $move->type !== 'ServiceBulkExchange') $hnagv += $m3Exit;
                elseif ($move->type === 'ServiceBulkExchange') $perifericos += $m3Exit;

                if (in_array($move->type, ['SupplierEntry', 'SupplierMovement'])) {
                    $totalIngresoShift += $move->cylinderMovements->where('action', 'Entry')->sum(function($cm) {
                        return (float) ($cm->cylinder->capacity ?? 0);
                    });
                }
            }

            $totalShift = $padomi + $hnagv + $perifericos;
            $grandTotalConsumo += $totalShift;
            $grandTotalIngreso += $totalIngresoShift;

            // Avanzar el stock al final del turno (que será el inicio del siguiente turno)
            $nextStock = $this->applyShiftMovementsToStock($currFull, $currEmpty, $shiftMoves);

            $shiftData[$name] = [
                'padomi' => $padomi,
                'hnagv' => $hnagv,
                'perifericos' => $perifericos,
                'total' => $totalShift,
                'total_ingreso' => $totalIngresoShift,
                'operators' => $shiftMoves->pluck('user.name')->unique()->filter()->values(),
                'reserva_llenos' => $nextStock['full']->values(),
                'almacen_vacios' => $nextStock['empty']->values(),
                'movements' => $shiftMoves
            ];

            $currFull = $nextStock['full'];
            $currEmpty = $nextStock['empty'];
        }

        return response()->json([
            'date' => $date,
            'shifts' => $shiftData,
            'grand_total' => $grandTotalConsumo,
            'grand_total_ingreso' => $grandTotalIngreso,
            'initial_balance' => $initialBalanceM3,
        ]);
    }

    /**
     * Reporte Auxiliar: Kardex General y Control de Atención con Filtros Avanzados
     */
    public function kardexGeneral(Request $request)
    {
        $perPageParam = $request->query('per_page', 20);
        $perPage = 20;
        if ($perPageParam === 'all') {
            $perPage = 100;
        } elseif (is_numeric($perPageParam)) {
            $perPage = min((int) $perPageParam, 100);
            if ($perPage <= 0) $perPage = 20;
        }

        $date = $request->query('date');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $type = $request->query('type');
        $search = $request->query('search');

        $query = InventoryMovement::with([
                'user',
                'patient',
                'service',
                'bed',
                'supplier',
                'cylinderMovements.cylinder.ownershipType',
                'cylinderMovements.cylinder.supplier'
            ])
            ->orderBy('movement_at', 'desc')
            ->orderBy('id', 'desc');

        if ($date) {
            $startOfDay = Carbon::parse($date)->setTime(7, 0, 0);
            $endOfDay = Carbon::parse($date)->addDay()->setTime(7, 0, 0);
            $query->whereBetween('movement_at', [$startOfDay, $endOfDay]);
        }
        if ($startDate) {
            $start = Carbon::parse($startDate)->setTime(7, 0, 0);
            $query->where('movement_at', '>=', $start);
        }
        if ($endDate) {
            $end = Carbon::parse($endDate)->addDay()->setTime(7, 0, 0);
            $query->where('movement_at', '<', $end);
        }
        if ($type) {
            $query->where('type', $type);
        }
        if ($search) {
            $query->where(function($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search)
                      ->orWhere('attention_number', (int) $search);
                }
                $q->orWhere('reference_document', 'like', "%{$search}%")
                  ->orWhereHas('patient', function($sub) use ($search) {
                      $sub->where('full_name', 'like', "%{$search}%")
                          ->orWhere('dni', 'like', "%{$search}%")
                          ->orWhere('exchange_code', 'like', "%{$search}%");
                  })
                  ->orWhereHas('service', function($sub) use ($search) {
                      $sub->where('name', 'like', "%{$search}%")
                          ->orWhere('abbreviation', 'like', "%{$search}%");
                  })
                  ->orWhereHas('supplier', function($sub) use ($search) {
                      $sub->where('name', 'like', "%{$search}%")
                          ->orWhere('ruc', 'like', "%{$search}%");
                  })
                  ->orWhereHas('cylinderMovements.cylinder', function($sub) use ($search) {
                      $sub->where('serial_number', 'like', "%{$search}%")
                          ->orWhere('barcode', 'like', "%{$search}%");
                  });
            });
        }

        $kardex = $query->paginate($perPage);
                           
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

        // 4. Desglose detallado de balones en CENTRAL
        $centralBreakdown = Cylinder::where('location', 'CENTRAL')
            ->whereIn('status', ['full', 'empty'])
            ->select('status', 'capacity', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
            ->groupBy('status', 'capacity', 'ownership_type_id', 'supplier_id')
            ->with(['ownershipType', 'supplier'])
            ->get();

        return response()->json([
            'full_central_count' => $fullCentralCount,
            'empty_central_count' => $emptyCentralCount,
            'tank_level' => $tankLevel,
            'last_reading_time' => $lastReadingTime,
            'breakdown' => $centralBreakdown,
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
        $months = (int) $request->query('months', 3);
        if (!in_array($months, [3, 6, 9, 12])) {
            $months = 3;
        }
        $dateLimit = Carbon::now()->subMonths($months);

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

        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

        $movements = InventoryMovement::with(['user', 'patient', 'service', 'supplier', 'cylinderMovements.cylinder'])
            ->whereBetween('movement_at', [$startDateTime, $endDateTime])
            ->where('shift', $shift)
            ->get();

        $decantings = Decanting::with(['user', 'patient', 'service', 'cylinder'])
            ->whereBetween('decanted_at', [$startDateTime, $endDateTime])
            ->where('shift', $shift)
            ->get();

        $readings = \App\Models\DailyReading::with('user')
            ->whereBetween('reading_date', [$startDateTime, $endDateTime])
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

    /**
     * REPORTE: Búsqueda avanzada de movimientos y trasiegos de cilindros
     */
    public function movementsSearch(Request $request)
    {
        $patientQuery = $request->query('patient');      // ID, DNI or Name
        $serviceQuery = $request->query('service');      // ID or Name
        $bedQuery = $request->query('bed');              // ID
        $supplierQuery = $request->query('supplier');    // ID or Name
        $cylinderQuery = $request->query('cylinder');    // serial number or barcode
        $referenceQuery = $request->query('reference');  // reference_document
        $shift = $request->query('shift');                // Morning, Afternoon, Night
        $startDate = $request->query('start_date');      // YYYY-MM-DD
        $endDate = $request->query('end_date');          // YYYY-MM-DD
        $isExport = filter_var($request->query('export', false), FILTER_VALIDATE_BOOLEAN);
        $limit = $isExport ? 10000 : 1000;

        // 1. Query CylinderMovements
        $cmQuery = CylinderMovement::with([
            'cylinder.ownershipType',
            'cylinder.supplier',
            'inventoryMovement.user',
            'inventoryMovement.patient',
            'inventoryMovement.service',
            'inventoryMovement.supplier'
        ]);

        // Apply filters to CylinderMovement query
        if ($patientQuery) {
            $cmQuery->whereHas('inventoryMovement.patient', function ($q) use ($patientQuery) {
                if (is_numeric($patientQuery)) {
                    $q->where('id', $patientQuery);
                } else {
                    $q->where(function($sub) use ($patientQuery) {
                        $sub->where('dni', 'like', "%{$patientQuery}%")
                            ->orWhere('full_name', 'like', "%{$patientQuery}%")
                            ->orWhere('exchange_code', 'like', "%{$patientQuery}%")
                            ->orWhere('trasiego_code', 'like', "%{$patientQuery}%");
                    });
                }
            });
        }

        if ($serviceQuery) {
            $cmQuery->whereHas('inventoryMovement.service', function ($q) use ($serviceQuery) {
                if (is_numeric($serviceQuery)) {
                    $q->where('id', $serviceQuery);
                } else {
                    $q->where('name', 'like', "%{$serviceQuery}%");
                }
            });
        }

        if ($bedQuery) {
            $cmQuery->whereHas('inventoryMovement', function ($q) use ($bedQuery) {
                $q->where('bed_id', $bedQuery);
            });
        }

        if ($supplierQuery) {
            $cmQuery->whereHas('inventoryMovement.supplier', function ($q) use ($supplierQuery) {
                if (is_numeric($supplierQuery)) {
                    $q->where('id', $supplierQuery);
                } else {
                    $q->where(function($sub) use ($supplierQuery) {
                        $sub->where('name', 'like', "%{$supplierQuery}%")
                            ->orWhere('ruc', 'like', "%{$supplierQuery}%");
                    });
                }
            });
        }

        if ($cylinderQuery) {
            $cmQuery->whereHas('cylinder', function ($q) use ($cylinderQuery) {
                if (is_numeric($cylinderQuery)) {
                    $q->where('id', $cylinderQuery);
                } else {
                    $q->where(function($sub) use ($cylinderQuery) {
                        $sub->where('serial_number', 'like', "%{$cylinderQuery}%")
                            ->orWhere('barcode', 'like', "%{$cylinderQuery}%");
                    });
                }
            });
        }

        if ($referenceQuery) {
            $cmQuery->whereHas('inventoryMovement', function ($q) use ($referenceQuery) {
                $q->where('reference_document', 'like', "%{$referenceQuery}%")
                  ->orWhereHas('patient', function ($sub) use ($referenceQuery) {
                      $sub->where('exchange_code', 'like', "%{$referenceQuery}%")
                          ->orWhere('trasiego_code', 'like', "%{$referenceQuery}%");
                  });
            });
        }

        if ($shift) {
            $cmQuery->whereHas('inventoryMovement', function ($q) use ($shift) {
                $q->where('shift', $shift);
            });
        }

        if ($startDate) {
            $cmQuery->whereHas('inventoryMovement', function ($q) use ($startDate) {
                $q->whereDate('movement_at', '>=', $startDate);
            });
        }

        if ($endDate) {
            $cmQuery->whereHas('inventoryMovement', function ($q) use ($endDate) {
                $q->whereDate('movement_at', '<=', $endDate);
            });
        }

        // Limit results to avoid memory crash
        $cylinderMovements = $cmQuery->orderBy('id', 'desc')->take($limit)->get();

        // 2. Query Decantings (if not searching for supplier)
        $decantings = collect();
        if (!$supplierQuery) {
            $decQuery = Decanting::with([
                'cylinder.ownershipType',
                'cylinder.supplier',
                'user',
                'patient',
                'service'
            ]);

            if ($patientQuery) {
                $decQuery->whereHas('patient', function ($q) use ($patientQuery) {
                    if (is_numeric($patientQuery)) {
                        $q->where('id', $patientQuery);
                    } else {
                        $q->where(function($sub) use ($patientQuery) {
                            $sub->where('dni', 'like', "%{$patientQuery}%")
                                ->orWhere('full_name', 'like', "%{$patientQuery}%")
                                ->orWhere('exchange_code', 'like', "%{$patientQuery}%")
                                ->orWhere('trasiego_code', 'like', "%{$patientQuery}%");
                        });
                    }
                });
            }

            if ($serviceQuery) {
                $decQuery->whereHas('service', function ($q) use ($serviceQuery) {
                    if (is_numeric($serviceQuery)) {
                        $q->where('id', $serviceQuery);
                    } else {
                        $q->where('name', 'like', "%{$serviceQuery}%");
                    }
                });
            }

            if ($cylinderQuery) {
                $decQuery->whereHas('cylinder', function ($q) use ($cylinderQuery) {
                    if (is_numeric($cylinderQuery)) {
                        $q->where('id', $cylinderQuery);
                    } else {
                        $q->where(function($sub) use ($cylinderQuery) {
                            $sub->where('serial_number', 'like', "%{$cylinderQuery}%")
                                ->orWhere('barcode', 'like', "%{$cylinderQuery}%");
                        });
                    }
                });
            }

            if ($referenceQuery) {
                $decQuery->whereHas('patient', function ($q) use ($referenceQuery) {
                    $q->where('exchange_code', 'like', "%{$referenceQuery}%")
                      ->orWhere('trasiego_code', 'like', "%{$referenceQuery}%");
                });
            }

            if ($shift) {
                $decQuery->where('shift', $shift);
            }

            if ($startDate) {
                $start = \Carbon\Carbon::parse($startDate)->setTime(7, 0, 0);
                $decQuery->where('decanted_at', '>=', $start);
            }

            if ($endDate) {
                $end = \Carbon\Carbon::parse($endDate)->addDay()->setTime(7, 0, 0);
                $decQuery->where('decanted_at', '<', $end);
            }

            $decantings = $decQuery->orderBy('id', 'desc')->take($limit)->get();
        }

        // 3. Map both results to a unified structure
        $mappedMovements = $cylinderMovements->map(function ($cm) {
            $im = $cm->inventoryMovement;
            if (!$im) return null;
            
            // Determine type label in Spanish
            $typeLabel = 'Movimiento';
            if ($im->type === 'Exchange') {
                $typeLabel = $im->patient ? 'Intercambio PADOMI' : 'Intercambio HNAGV';
            } elseif ($im->type === 'SupplierMovement') {
                $typeLabel = 'Salida Proveedor';
            } elseif ($im->type === 'SupplierEntry') {
                $typeLabel = 'Ingreso Proveedor';
            } elseif ($im->type === 'ServiceBulkExchange') {
                $typeLabel = 'Canje de Red (Periferia)';
            } elseif ($im->type === 'Loan') {
                $typeLabel = 'Préstamo';
            } elseif ($im->type === 'Return') {
                $typeLabel = 'Devolución';
            } elseif ($im->type === 'PatientReturn') {
                $typeLabel = 'Devolución Paciente';
            }

            // Determine action label
            $actionLabel = $cm->action === 'Entry' ? 'Ingreso' : 'Salida';

            // Determine destination/location
            $locationType = 'Almacén Central';
            $locationName = 'Almacén Central';
            $locationDetail = '';

            $patientCode = null;
            $patientAddress = null;

            $serviceAbbreviation = null;

            if ($im->patient) {
                $locationType = 'Paciente';
                $locationName = $im->patient->full_name;
                $locationDetail = $im->patient->dni ? 'DNI: ' . $im->patient->dni : ($im->patient->exchange_code ?: '');
                $patientCode = $im->patient->exchange_code ?: ($im->patient->trasiego_code ?: $im->patient->dni);
                $patientAddress = $im->patient->address;
            } elseif ($im->service) {
                if ($im->type === 'ServiceBulkExchange') {
                    $locationType = 'Centro Asistencial (Periferia)';
                    $locationName = $im->service->name;
                    $locationDetail = 'PERIFERIE / CENTRO MÉDICO';
                } else {
                    $locationType = 'Servicio (Hospital)';
                    $locationName = $im->service->name;
                    $locationDetail = $im->service->type;
                    if ($im->bed) {
                        $locationDetail .= ' - Cama: ' . $im->bed->bed_number;
                    }
                }
                $serviceAbbreviation = $im->service->abbreviation;
            } elseif ($im->supplier) {
                $locationType = 'Proveedor';
                $locationName = $im->supplier->name;
                $locationDetail = $im->supplier->ruc ? 'RUC: ' . $im->supplier->ruc : '';
            } elseif ($im->authority) {
                $locationType = 'Autoridad/Tercero';
                $locationName = $im->authority->name;
                $locationDetail = $im->authority->type ?: 'Entidad Externa';
            }

            return [
                'id' => 'M-' . $cm->id,
                'movement_id' => $im->id,
                'date' => $im->movement_at,
                'shift' => $im->shift,
                'type' => $typeLabel,
                'action' => $actionLabel,
                'cylinder_status' => $cm->cylinder_status,
                'reference_document' => $im->reference_document ?: '-',
                'notes' => $im->notes ?: '',
                'user' => $im->user?->name ?: 'N/A',
                'cylinder' => [
                    'id' => $cm->cylinder?->id,
                    'serial_number' => $cm->cylinder?->serial_number ?: 'N/A',
                    'barcode' => $cm->cylinder?->barcode ?: '',
                    'capacity' => $cm->cylinder?->capacity ?: 0,
                    'ownership_type' => $cm->cylinder?->ownershipType?->name ?: 'S/D',
                    'supplier' => $cm->cylinder?->supplier?->name ?: 'S/D',
                ],
                'location' => [
                    'type' => $locationType,
                    'name' => $locationName,
                    'detail' => $locationDetail,
                    'patient_code' => $patientCode,
                    'patient_address' => $patientAddress,
                    'service_abbreviation' => $serviceAbbreviation,
                ]
            ];
        })->filter();

        $mappedDecantings = $decantings->map(function ($dec) {
            $locationType = 'Trasiego';
            $locationName = $dec->manual_destination ?: 'Estación de Trasiego';
            $locationDetail = 'Cantidad: ' . $dec->refilled_amount . ' m³';

            $patientCode = null;
            $patientAddress = null;

            $serviceAbbreviation = null;

            if ($dec->patient) {
                $locationType = 'Paciente (Trasiego)';
                $locationName = $dec->patient->full_name;
                $locationDetail = 'DNI: ' . $dec->patient->dni;
                $patientCode = $dec->patient->exchange_code ?: ($dec->patient->trasiego_code ?: $dec->patient->dni);
                $patientAddress = $dec->patient->address;
            } elseif ($dec->service) {
                $locationType = 'Servicio (Trasiego)';
                $locationName = $dec->service->name;
                $locationDetail = 'Trasiego Recarga';
                $serviceAbbreviation = $dec->service->abbreviation;
            }

            return [
                'id' => 'T-' . $dec->id,
                'movement_id' => null,
                'date' => $dec->decanted_at,
                'shift' => $dec->shift,
                'type' => 'Trasiego (Decantación)',
                'action' => 'Recarga',
                'cylinder_status' => 'full (refilled)',
                'reference_document' => '-',
                'notes' => 'Recarga de ' . $dec->refilled_amount . ' m³',
                'user' => $dec->user?->name ?: 'N/A',
                'cylinder' => [
                    'id' => $dec->cylinder?->id,
                    'serial_number' => $dec->cylinder?->serial_number ?: 'N/A',
                    'barcode' => $dec->cylinder?->barcode ?: '',
                    'capacity' => $dec->cylinder?->capacity ?: 0,
                    'ownership_type' => $dec->cylinder?->ownershipType?->name ?: 'S/D',
                    'supplier' => $dec->cylinder?->supplier?->name ?: 'S/D',
                ],
                'location' => [
                    'type' => $locationType,
                    'name' => $locationName,
                    'detail' => $locationDetail,
                    'patient_code' => $patientCode,
                    'patient_address' => $patientAddress,
                    'service_abbreviation' => $serviceAbbreviation,
                ]
            ];
        });

        // 4. Combine and sort
        $results = $mappedMovements->concat($mappedDecantings)->sortByDesc('date')->values();

        // 5. Manual Pagination
        $page = $request->query('page', 1);
        $perPage = $isExport ? $limit : 20;
        $total = $results->count();

        $paginatedResults = new LengthAwarePaginator(
            $results->forPage($page, $perPage)->values(),
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json($paginatedResults);
    }

    public function patientAlerts(Request $request)
    {
        $threeMonthsAgo = \Carbon\Carbon::now()->subMonths(3);
        $today = \Carbon\Carbon::now()->startOfDay();

        $cylinders = \App\Models\Cylinder::with(['currentPatient.prescriptions', 'ownershipType', 'movements.inventoryMovement'])
            ->whereNotNull('current_patient_id')
            ->where('status', 'in_use')
            ->get()
            ->filter(function ($cylinder) use ($threeMonthsAgo, $today) {
                // Obtenemos el último movimiento de salida para este cilindro
                $lastExit = collect($cylinder->movements)
                    ->where('action', 'Exit')
                    ->sortByDesc(function($m) {
                        return $m->inventoryMovement ? $m->inventoryMovement->movement_at : $m->created_at;
                    })
                    ->first();

                if ($lastExit && $lastExit->inventoryMovement) {
                    $movement = $lastExit->inventoryMovement;
                    
                    // ALERTA 1: Si fue un préstamo con fecha límite vencida
                    if ($movement->type === 'PatientLoan' && !empty($movement->expected_return_date)) {
                        $expectedDate = \Carbon\Carbon::parse($movement->expected_return_date)->startOfDay();
                        if ($today->gt($expectedDate)) {
                            // Agregar flag temporal para el frontend
                            $cylinder->alert_reason = 'Préstamo Vencido';
                            $cylinder->expected_return_date = $movement->expected_return_date;
                            return true;
                        }
                    }

                    // ALERTA 2: Regla estándar de 3 meses retenidos
                    $date = $movement->movement_at;
                    if (\Carbon\Carbon::parse($date)->lt($threeMonthsAgo)) {
                        $cylinder->alert_reason = 'Retenido > 3 meses';
                        return true;
                    }
                } elseif ($lastExit) {
                    // Si no hay InventoryMovement pero hay CylinderMovement, usamos regla de 3 meses
                    $date = $lastExit->created_at;
                    if (\Carbon\Carbon::parse($date)->lt($threeMonthsAgo)) {
                        $cylinder->alert_reason = 'Retenido > 3 meses';
                        return true;
                    }
                }
                
                return false;
            })
            ->values();

        return response()->json($cylinders);
    }

    public function hospitalizationControl(Request $request)
    {
        $cylinders = Cylinder::with(['ownershipType', 'currentService', 'currentBed'])
            ->where('status', 'in_use')
            ->where('location', 'HOSPITALIZACION')
            ->get();

        $sorted = $cylinders->sortBy([
            ['currentService.name', 'asc'],
            ['currentBed.name', 'asc']
        ])->values();

        return response()->json($sorted);
    }

    /**
     * REPORTE: Intercambios PADOMI
     */
    public function padomiExchanges(Request $request)
    {
        $perPageParam = $request->query('per_page', 20);
        $perPage = ($perPageParam === 'all') ? 500 : (int) $perPageParam;

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = InventoryMovement::with([
            'patient',
            'prescription',
            'cylinderMovements.cylinder.ownershipType',
            'cylinderMovements.cylinder.supplier'
        ])
        ->where('type', 'Exchange')
        ->whereNotNull('patient_id')
        ->orderBy('movement_at', 'desc');

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
            $query->whereBetween('movement_at', [$start, $end]);
        }

        $exchanges = $query->paginate($perPage);

        return response()->json($exchanges);
    }

    /**
     * REPORTE GERENCIAL: Consumo Ejecutivo (Gaseoso y Líquido Consolidado)
     */
    public function executiveConsumption(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        
        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

        // ==========================================
        // 1. GASEOSO - SALDO INICIAL (Corte histórico exacto a las 07:00 AM)
        // ==========================================
        $historicalInventory = $this->getHistoricalInventory($date);
        $fullStockAt7am = collect($historicalInventory['full'] ?? [])->whereIn('location', ['CENTRAL', 'ALMACEN']);
        
        $saldoInicialGas = [
            '10' => 0, '8' => 0, '6' => 0, 'total_und' => 0, 'total_m3' => 0
        ];
        foreach ($fullStockAt7am as $item) {
            $cap = (int) ($item['capacity'] ?? 0);
            $tot = (int) ($item['total'] ?? 0);
            if (in_array($cap, [10, 8, 6])) {
                $saldoInicialGas[$cap] += $tot;
                $saldoInicialGas['total_und'] += $tot;
                $saldoInicialGas['total_m3'] += ($cap * $tot);
            }
        }

        // ==========================================
        // 2. GASEOSO - CONSUMO DEL DIA (07:00 AM a 07:00 AM siguiente)
        // ==========================================
        $movements = InventoryMovement::whereBetween('movement_at', [$startDateTime, $endDateTime])
            ->with(['cylinderMovements.cylinder', 'service', 'patient'])
            ->get();

        $consumoGas = [
            'padomi' => ['10' => 0, '8' => 0, '6' => 0],
            'hnagv' => ['10' => 0, '8' => 0, '6' => 0],
            'perifericos' => ['10' => 0, '8' => 0, '6' => 0],
            'total_und' => ['10' => 0, '8' => 0, '6' => 0, 'all' => 0],
            'total_m3' => 0
        ];

        foreach ($movements as $mov) {
            $exits = $mov->cylinderMovements->where('action', 'Exit');
            foreach ($exits as $exit) {
                $cap = (int) ($exit->cylinder->capacity ?? 0);
                if (!in_array($cap, [10, 8, 6])) continue;

                if ($mov->patient_id) {
                    $consumoGas['padomi'][$cap] += 1;
                    $consumoGas['total_und'][$cap] += 1;
                    $consumoGas['total_und']['all'] += 1;
                    $consumoGas['total_m3'] += $cap;
                } elseif ($mov->service_id && $mov->type !== 'ServiceBulkExchange') {
                    $consumoGas['hnagv'][$cap] += 1;
                    $consumoGas['total_und'][$cap] += 1;
                    $consumoGas['total_und']['all'] += 1;
                    $consumoGas['total_m3'] += $cap;
                } elseif ($mov->type === 'ServiceBulkExchange') {
                    $consumoGas['perifericos'][$cap] += 1;
                    $consumoGas['total_und'][$cap] += 1;
                    $consumoGas['total_und']['all'] += 1;
                    $consumoGas['total_m3'] += $cap;
                }
            }
        }

        // ==========================================
        // 3. GASEOSO - INGRESO DEL DÍA
        // ==========================================
        $ingresoGas = ['10' => 0, '8' => 0, '6' => 0, 'total_und' => 0, 'total_m3' => 0];
        foreach ($movements as $mov) {
            if (in_array($mov->type, ['SupplierEntry', 'SupplierMovement'])) {
                $entries = $mov->cylinderMovements->where('action', 'Entry');
                foreach ($entries as $entry) {
                    $cap = (int) ($entry->cylinder->capacity ?? 0);
                    if (in_array($cap, [10, 8, 6])) {
                        $ingresoGas[$cap] += 1;
                        $ingresoGas['total_und'] += 1;
                        $ingresoGas['total_m3'] += $cap;
                    }
                }
            }
        }

        // ==========================================
        // 4. GASEOSO - RESERVA LLENOS (Calculado al final de los turnos)
        // ==========================================
        // Calculamos la reserva final aplicando los movimientos del día sobre el saldo inicial
        $currFull = collect($historicalInventory['full'] ?? []);
        $currEmpty = collect($historicalInventory['empty'] ?? []);
        $stockEndDay = $this->applyShiftMovementsToStock($currFull, $currEmpty, $movements);
        
        $llenosFisico = collect($stockEndDay['full'] ?? [])->whereIn('location', ['CENTRAL', 'ALMACEN'])->values();

        $reservaLlenos = [
            'central' => ['10' => 0, '8' => 0, '6' => 0],
            'almacen' => ['10' => 0, '8' => 0, '6' => 0],
            'total_und' => ['10' => 0, '8' => 0, '6' => 0, 'all' => 0],
            'total_m3' => 0
        ];

        foreach ($llenosFisico as $lleno) {
            $cap = (int) ($lleno['capacity'] ?? 0);
            $tot = (int) ($lleno['total'] ?? 0);
            if (!in_array($cap, [10, 8, 6])) continue;

            $loc = strtolower($lleno['location'] ?? 'central');
            if ($loc === 'central') $reservaLlenos['central'][$cap] += $tot;
            elseif ($loc === 'almacen') $reservaLlenos['almacen'][$cap] += $tot;
            else $reservaLlenos['central'][$cap] += $tot;

            $reservaLlenos['total_und'][$cap] += $tot;
            $reservaLlenos['total_und']['all'] += $tot;
            $reservaLlenos['total_m3'] += ($cap * $tot);
        }

        // ==========================================
        // 5. GASEOSO - RESERVA VACIOS
        // ==========================================
        $vaciosFisico = collect($stockEndDay['empty'] ?? [])->whereIn('location', ['CENTRAL', 'ALMACEN'])->values();

        $reservaVacios = [
            'linde' => ['10' => 0, '8' => 0, '6' => 0],
            'essalud' => ['10' => 0, '8' => 0, '6' => 0],
            'periferia' => ['10' => 0, '8' => 0, '6' => 0],
            'mantenimiento' => ['10' => 0, '8' => 0, '6' => 0],
            'desconocidos' => ['10' => 0, '8' => 0, '6' => 0],
            'total_und' => ['10' => 0, '8' => 0, '6' => 0, 'all' => 0]
        ];

        foreach ($vaciosFisico as $vacio) {
            $cap = (int) ($vacio['capacity'] ?? 0);
            if (!in_array($cap, [10, 8, 6])) continue;

            $cond = strtolower(trim($vacio['physical_condition'] ?? ''));
            $own = strtolower(trim($vacio['ownership_type_name'] ?? $vacio['ownership_type']['name'] ?? ''));
            $sup = strtolower(trim($vacio['supplier_name'] ?? $vacio['supplier']['name'] ?? ''));
            $tot = (int) ($vacio['total'] ?? 1);

            $mappedGroup = 'desconocidos';
            if ($cond === 'mala' || $cond === 'bad' || str_contains($own, 'mantenimiento')) {
                $mappedGroup = 'mantenimiento';
            } elseif (str_contains($own, 'linde') || str_contains($sup, 'linde') || str_contains($own, 'praxair') || str_contains($sup, 'praxair')) {
                $mappedGroup = 'linde';
            } elseif (str_contains($own, 'essalud')) {
                $mappedGroup = 'essalud';
            } elseif (str_contains($own, 'periferi') || str_contains($sup, 'periferi')) {
                $mappedGroup = 'periferia';
            }

            $reservaVacios[$mappedGroup][$cap] += $tot;
            $reservaVacios['total_und'][$cap] += $tot;
            $reservaVacios['total_und']['all'] += $tot;
        }

        // ==========================================
        // 6. LÍQUIDO - RECUPERACIÓN / PERSISTENCIA
        // ==========================================
            // Lectura del día anterior para saldo inicial y consumo
            $previousReading = \App\Models\DailyReading::where('reading_date', '<', $date)
                ->orderBy('reading_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();
                
            // Lectura de dos días antes
            $twoDaysAgoReading = null;
            if ($previousReading) {
                $twoDaysAgoReading = \App\Models\DailyReading::where('reading_date', '<', $previousReading->reading_date)
                    ->orderBy('reading_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->first();
            }
            
            $dayReadings = \App\Models\DailyReading::where('reading_date', $date)
                ->orderBy('id', 'asc')
                ->get();
            
            $firstReading = $dayReadings->first();
            $lastReading = $dayReadings->last();

            $prevPrevLevel = $twoDaysAgoReading ? (float) $twoDaysAgoReading->tank_level : 0;
            $prevLevel = $previousReading ? (float) $previousReading->tank_level : 0;
            // Si hoy no hay lectura, nivel actual = nivel de ayer
            $currLevelFinal = $lastReading ? (float) $lastReading->tank_level : ($prevLevel > 0 ? $prevLevel : 264.6);

            $prevFlow = $previousReading ? (float) $previousReading->flow_meter_reading : 0;
            $currFlow = $lastReading ? (float) $lastReading->flow_meter_reading : ($firstReading ? (float) $firstReading->flow_meter_reading : $prevFlow);

            $refills = \App\Models\LiquidRefill::whereDate('refilled_at', $date)->get();
            $refillBefore = $refills->isNotEmpty() ? (float) $refills->first()->level_before : 0;
            $refillAfter = $refills->isNotEmpty() ? (float) $refills->last()->level_after : 0;

            $factor = 55.9;

            // SALDO INICIAL: LECTURA ANTERIOR = dos días antes, LECTURA ACTUAL = ayer
            $saldoInicialM3 = round($prevLevel * $factor, 2);

            $consumoM3 = max(0, round($currFlow - $prevFlow, 2));
            $consumoHora = $consumoM3 > 0 ? round($consumoM3 / 24, 6) : 0;

            $refillDiff = max(0, round($refillAfter - $refillBefore, 2));
            $refillM3 = round($refillDiff * $factor, 2);

            // RESERVA: NIVEL ACTUAL = hoy
            $reservaM3 = round($currLevelFinal * $factor, 2);
            $proyeccionDias = $consumoM3 > 0 ? round($reservaM3 / $consumoM3, 4) : 0;

        $liquidoFinal = [
            'saldo_inicial' => [
                'lectura_anterior' => $prevPrevLevel,
                'lectura_actual' => $prevLevel,
                'saldo_inicial_m3' => $saldoInicialM3
            ],
            'consumo' => [
                'lectura_anterior' => $prevFlow,
                'lectura_actual' => $currFlow,
                'consumo_m3' => $consumoM3,
                'consumo_hora' => $consumoHora
            ],
            'ingreso' => [
                'inicial' => $refillBefore,
                'final' => $refillAfter,
                'diferencia' => $refillDiff,
                'recargado_m3' => $refillM3
            ],
            'reserva' => [
                'nivel_anterior' => $prevLevel,
                'nivel_actual' => $currLevelFinal,
                'reserva_m3' => $reservaM3,
                'proyeccion_dias' => $proyeccionDias
            ]
        ];

        return response()->json([
            'date' => $date,
            'gaseoso' => [
                'saldo_inicial' => $saldoInicialGas,
                'consumo' => $consumoGas,
                'ingreso' => $ingresoGas,
                'reserva_llenos' => $reservaLlenos,
                'reserva_vacios' => $reservaVacios
            ],
            'liquido' => $liquidoFinal
        ]);
    }


}
