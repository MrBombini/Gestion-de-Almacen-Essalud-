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
            ->whereNull('deleted_at')
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
        $isToday = Carbon::parse($date)->isToday();
        
        $usedLiveStock = false;
        if ($isToday) {
            $initialBalance = Cylinder::where('location', 'CENTRAL')
                ->select('capacity', 'status', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
                ->groupBy('capacity', 'status', 'ownership_type_id', 'supplier_id')
                ->with(['ownershipType', 'supplier'])
                ->get();
            $usedLiveStock = true;
        } else {
            $previousDate = Carbon::parse($date)->subDay()->toDateString();
            $snapshot = \App\Models\DailySnapshot::where('date', $previousDate)->first();
            
            if ($snapshot && (isset($snapshot->snapshot_data['full']) || isset($snapshot->snapshot_data['empty']))) {
                $full = collect($snapshot->snapshot_data['full'] ?? [])->where('location', 'CENTRAL')->map(function($item) {
                    $item['status'] = 'full';
                    return $item;
                });
                $empty = collect($snapshot->snapshot_data['empty'] ?? [])->where('location', 'CENTRAL')->map(function($item) {
                    $item['status'] = 'empty';
                    return $item;
                });
                $initialBalance = $full->concat($empty)->values();
            } else {
                // Fallback to live stock if snapshot is missing
                $initialBalance = Cylinder::where('location', 'CENTRAL')
                    ->select('capacity', 'status', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
                    ->groupBy('capacity', 'status', 'ownership_type_id', 'supplier_id')
                    ->with(['ownershipType', 'supplier'])
                    ->get();
                $usedLiveStock = true;
            }
        }
            
        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

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
            ->whereBetween('movement_at', [$startDateTime, $endDateTime])
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
            'used_live_stock' => $usedLiveStock,
            'stock_summary' => $stockSummary,
            'initial_balance' => $initialBalance,
            'shifts' => $formattedShifts,
            'note' => 'El saldo inicial detallado y por propietario muestra una captura en tiempo real del estado actual del almacén.'
        ]);
    }

    /**
     * REPORTE 2: REGISTRO DE CONSUMO DE OXÍGENO DIARIO
     * Panel consolidado de m3 entregados y estado de la reserva por turnos.
     */
    public function dailyConsumptionDashboard(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        
        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

        // 1. Obtener todos los movimientos del día con relaciones completas de cilindros y marcas
        $movements = InventoryMovement::whereBetween('movement_at', [$startDateTime, $endDateTime])
            ->with(['cylinderMovements.cylinder.ownershipType', 'user', 'patient', 'service'])
            ->get();

        // 2. Estado Físico ACTUAL del almacén
        $fullStock = Cylinder::where('status', 'full')
            ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id')
            ->with(['ownershipType', 'supplier'])
            ->get();

        $emptyStock = Cylinder::where('status', 'empty')
            ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', DB::raw('count(*) as total'))
            ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id')
            ->with(['ownershipType', 'supplier'])
            ->get();

        $shifts = ['Morning' => 'MAÑANA', 'Afternoon' => 'TARDE', 'Night' => 'NOCHE'];
        $shiftData = [];
        $grandTotal = 0;

        foreach ($shifts as $key => $name) {
            $shiftMoves = $movements->where('shift', $key)->values();
            
            $padomi = 0;
            $hnagv = 0;
            $perifericos = 0;
            $totalIngresoShift = 0;

            foreach ($shiftMoves as $move) {
                // Consumo (Salidas)
                $m3Exit = $move->cylinderMovements->where('action', 'Exit')->sum(function($cm) {
                    return (float) ($cm->cylinder->capacity ?? 0);
                });
                
                if ($move->patient_id) $padomi += $m3Exit;
                elseif ($move->service_id && $move->type !== 'ServiceBulkExchange') $hnagv += $m3Exit;
                elseif ($move->type === 'ServiceBulkExchange') $perifericos += $m3Exit;

                // Ingreso (Entradas de proveedores)
                if (in_array($move->type, ['SupplierEntry', 'SupplierMovement'])) {
                    $totalIngresoShift += $move->cylinderMovements->where('action', 'Entry')->sum(function($cm) {
                        return (float) ($cm->cylinder->capacity ?? 0);
                    });
                }
            }

            $totalShift = $padomi + $hnagv + $perifericos;
            $grandTotal += $totalShift;

            // Estructura anidada perfecta para React
            $shiftData[$name] = [
                'padomi' => $padomi,
                'hnagv' => $hnagv,
                'perifericos' => $perifericos,
                'total' => $totalShift,
                'total_ingreso' => $totalIngresoShift,
                'operators' => $shiftMoves->pluck('user.name')->unique()->filter()->values(),
                'reserva_llenos' => $fullStock,
                'almacen_vacios' => $emptyStock,
                'movements' => $shiftMoves
            ];
        }

        // Calcular Saldo Inicial Dinámico
        // Saldo Inicial = Stock Actual Físico Lleno (m3) - Total Ingresos del Día + Total Consumos del Día
        $isToday = Carbon::parse($date)->isToday();
        
        if ($isToday) {
            $currentFullM3 = 0;
            foreach ($fullStock as $stock) {
                $currentFullM3 += ((float) $stock->capacity * (int) $stock->total);
            }

            $totalIngresoDay = 0;
            $totalConsumoDay = 0;
            foreach ($shiftData as $shift) {
                $totalIngresoDay += $shift['total_ingreso'];
                $totalConsumoDay += $shift['total'];
            }

            $initialBalance = $currentFullM3 - $totalIngresoDay + $totalConsumoDay;
        } else {
            $previousDate = Carbon::parse($date)->subDay()->toDateString();
            $snapshot = \App\Models\DailySnapshot::where('date', $previousDate)->first();
            
            if ($snapshot && isset($snapshot->snapshot_data['full'])) {
                $snapshotFullStock = $snapshot->snapshot_data['full'];
                $initialBalance = 0;
                foreach ($snapshotFullStock as $stock) {
                    if (($stock['location'] ?? '') === 'CENTRAL') {
                        $initialBalance += ((float) ($stock['capacity'] ?? 0) * (int) ($stock['total'] ?? 0));
                    }
                }
            } else {
                $initialBalance = 0; // Sin registro = 0
            }
        }
        return response()->json([
            'date' => $date,
            'shifts' => $shiftData,
            'grand_total' => $grandTotal,
            'initial_balance' => $initialBalance,
        ]);
    }

    /**
     * Reporte Auxiliar: Kardex General (Listado simple)
     */
    public function kardexGeneral(Request $request)
    {
        $perPage = $request->query('per_page', 20);
        if ($perPage > 500) {
            $perPage = 500;
        }
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = InventoryMovement::with([
                'user',
                'patient',
                'service',
                'bed',
                'supplier',
                'cylinderMovements.cylinder.ownershipType',
                'cylinderMovements.cylinder.supplier'
            ])
            ->orderBy('movement_at', 'desc');

        if ($startDate) {
            $query->whereDate('movement_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('movement_at', '<=', $endDate);
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
                $decQuery->whereDate('decanted_at', '>=', $startDate);
            }

            if ($endDate) {
                $decQuery->whereDate('decanted_at', '<=', $endDate);
            }

            $decantings = $decQuery->orderBy('id', 'desc')->take($limit)->get();
        }

        // 3. Map both results to a unified structure
        $mappedMovements = $cylinderMovements->map(function ($cm) {
            $im = $cm->inventoryMovement;
            if (!$im) return null;
            
            // Determine type label in Spanish
            $typeLabel = 'Movimiento';
            if ($im->type === 'Exchange') $typeLabel = 'Intercambio';
            elseif ($im->type === 'SupplierMovement') $typeLabel = 'Salida Proveedor';
            elseif ($im->type === 'SupplierEntry') $typeLabel = 'Ingreso Proveedor';
            elseif ($im->type === 'ServiceBulkExchange') $typeLabel = 'Canje de Red (Periferia)';

            // Determine action label
            $actionLabel = $cm->action === 'Entry' ? 'Ingreso' : 'Salida';

            // Determine destination/location
            $locationType = 'Almacén Central';
            $locationName = 'Almacén Central';
            $locationDetail = '';

            if ($im->patient) {
                $locationType = 'Paciente';
                $locationName = $im->patient->full_name;
                $locationDetail = $im->patient->dni ? 'DNI: ' . $im->patient->dni : ($im->patient->exchange_code ?: '');
            } elseif ($im->service) {
                $locationType = 'Servicio (Hospital)';
                $locationName = $im->service->name;
                $locationDetail = $im->service->type;
                if ($im->bed) {
                    $locationDetail .= ' - Cama: ' . $im->bed->bed_number;
                }
            } elseif ($im->supplier) {
                $locationType = 'Proveedor';
                $locationName = $im->supplier->name;
                $locationDetail = $im->supplier->ruc ? 'RUC: ' . $im->supplier->ruc : '';
            }

            return [
                'id' => 'M-' . $cm->id,
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
                ],
                'location' => [
                    'type' => $locationType,
                    'name' => $locationName,
                    'detail' => $locationDetail,
                ]
            ];
        })->filter();

        $mappedDecantings = $decantings->map(function ($dec) {
            $locationType = 'Trasiego';
            $locationName = $dec->manual_destination ?: 'Estación de Trasiego';
            $locationDetail = 'Cantidad: ' . $dec->refilled_amount . ' m³';

            if ($dec->patient) {
                $locationType = 'Paciente (Trasiego)';
                $locationName = $dec->patient->full_name;
                $locationDetail = 'DNI: ' . $dec->patient->dni;
            } elseif ($dec->service) {
                $locationType = 'Servicio (Trasiego)';
                $locationName = $dec->service->name;
                $locationDetail = 'Trasiego Recarga';
            }

            return [
                'id' => 'T-' . $dec->id,
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
                ],
                'location' => [
                    'type' => $locationType,
                    'name' => $locationName,
                    'detail' => $locationDetail,
                ]
            ];
        });

        // 4. Combine and sort
        $results = $mappedMovements->concat($mappedDecantings)->sortByDesc('date')->values();

        // 5. Manual Pagination
        $page = $request->query('page', 1);
        $perPage = 20;
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

        $cylinders = \App\Models\Cylinder::with(['currentPatient.prescriptions', 'ownershipType', 'movements.inventoryMovement'])
            ->whereNotNull('current_patient_id')
            ->where('status', 'in_use')
            ->get()
            ->filter(function ($cylinder) use ($threeMonthsAgo) {
                $lastExit = collect($cylinder->movements)
                    ->where('action', 'Exit')
                    ->sortByDesc(function($m) {
                        return $m->inventoryMovement ? $m->inventoryMovement->movement_at : $m->created_at;
                    })
                    ->first();

                if ($lastExit) {
                    $date = $lastExit->inventoryMovement ? $lastExit->inventoryMovement->movement_at : $lastExit->created_at;
                    return \Carbon\Carbon::parse($date)->lt($threeMonthsAgo);
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
     * REPORTE GERENCIAL: Consumo Ejecutivo (Gaseoso y Líquido Consolidado)
     */
    public function executiveConsumption(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        $isToday = Carbon::parse($date)->isToday();
        
        $startDateTime = Carbon::parse($date)->setTime(7, 0, 0);
        $endDateTime = Carbon::parse($date)->addDay()->setTime(7, 0, 0);

        // ==========================================
        // 1. GASEOSO - SALDO INICIAL (Snapshots o Vivo)
        // ==========================================
        $gaseosoSaldoInicial = collect();
        if ($isToday) {
            $gaseosoSaldoInicial = Cylinder::whereIn('location', ['CENTRAL', 'ALMACEN'])
                ->select('capacity', DB::raw('count(*) as total'))
                ->groupBy('capacity')
                ->get();
        } else {
            $previousDate = Carbon::parse($date)->subDay()->toDateString();
            $snapshot = \App\Models\DailySnapshot::where('date', $previousDate)->first();
            
            if ($snapshot && (isset($snapshot->snapshot_data['full']) || isset($snapshot->snapshot_data['empty']))) {
                $full = collect($snapshot->snapshot_data['full'] ?? [])->whereIn('location', ['CENTRAL', 'ALMACEN']);
                $empty = collect($snapshot->snapshot_data['empty'] ?? [])->whereIn('location', ['CENTRAL', 'ALMACEN']);
                $gaseosoSaldoInicial = $full->concat($empty)->groupBy('capacity')->map(function ($group, $capacity) {
                    return [
                        'capacity' => $capacity,
                        'total' => $group->sum('total')
                    ];
                })->values();
            } else {
                $gaseosoSaldoInicial = Cylinder::whereIn('location', ['CENTRAL', 'ALMACEN'])
                    ->select('capacity', DB::raw('count(*) as total'))
                    ->groupBy('capacity')
                    ->get();
            }
        }

        // Formatear Saldo Inicial Gaseoso (10, 8, 6)
        $saldoInicialGas = [
            '10' => 0, '8' => 0, '6' => 0, 'total_und' => 0, 'total_m3' => 0
        ];
        foreach ($gaseosoSaldoInicial as $item) {
            $cap = (int) $item['capacity'];
            $tot = (int) $item['total'];
            if (in_array($cap, [10, 8, 6])) {
                $saldoInicialGas[$cap] += $tot;
                $saldoInicialGas['total_und'] += $tot;
                $saldoInicialGas['total_m3'] += ($cap * $tot);
            }
        }

        // ==========================================
        // 2. GASEOSO - CONSUMO DEL DIA
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
        // 4. GASEOSO - RESERVA (LLENOS ACTUALES)
        // ==========================================
        $llenosFisico = [];
        if (!$isToday && isset($snapshot) && $snapshot && isset($snapshot->snapshot_data['full'])) {
            $llenosFisico = collect($snapshot->snapshot_data['full'])->whereIn('location', ['CENTRAL', 'ALMACEN'])->toArray();
        } else {
            $llenosFisico = Cylinder::where('status', 'full')
                ->whereIn('location', ['CENTRAL', 'ALMACEN'])
                ->select('location', 'capacity', DB::raw('count(*) as total'))
                ->groupBy('location', 'capacity')
                ->get()
                ->toArray();
        }

        $reservaLlenos = [
            'central' => ['10' => 0, '8' => 0, '6' => 0],
            'almacen' => ['10' => 0, '8' => 0, '6' => 0],
            'total_und' => ['10' => 0, '8' => 0, '6' => 0, 'all' => 0],
            'total_m3' => 0
        ];

        foreach ($llenosFisico as $lleno) {
            $cap = (int) $lleno['capacity'];
            $tot = (int) $lleno['total'];
            if (!in_array($cap, [10, 8, 6])) continue;

            $loc = strtolower($lleno['location']);
            if ($loc === 'central') $reservaLlenos['central'][$cap] += $tot;
            elseif ($loc === 'almacen') $reservaLlenos['almacen'][$cap] += $tot;

            $reservaLlenos['total_und'][$cap] += $tot;
            $reservaLlenos['total_und']['all'] += $tot;
            $reservaLlenos['total_m3'] += ($cap * $tot);
        }

        // ==========================================
        // 5. GASEOSO - RESERVA VACIOS
        // ==========================================
        $vaciosFisico = [];
        if (!$isToday && isset($snapshot) && $snapshot && isset($snapshot->snapshot_data['empty'])) {
            $vaciosFisico = collect($snapshot->snapshot_data['empty'])->whereIn('location', ['CENTRAL', 'ALMACEN'])->toArray();
        } else {
            $vaciosFisico = Cylinder::where('status', 'empty')
                ->whereIn('location', ['CENTRAL', 'ALMACEN'])
                ->select('location', 'capacity', 'ownership_type_id', 'supplier_id', 'physical_condition', DB::raw('count(*) as total'))
                ->groupBy('location', 'capacity', 'ownership_type_id', 'supplier_id', 'physical_condition')
                ->with(['ownershipType', 'supplier'])
                ->get()
                ->toArray();
        }

        $reservaVacios = [
            'linde' => ['10' => 0, '8' => 0, '6' => 0],
            'essalud' => ['10' => 0, '8' => 0, '6' => 0],
            'periferia' => ['10' => 0, '8' => 0, '6' => 0],
            'mantenimiento' => ['10' => 0, '8' => 0, '6' => 0],
            'desconocidos' => ['10' => 0, '8' => 0, '6' => 0],
            'total_und' => ['10' => 0, '8' => 0, '6' => 0, 'all' => 0]
        ];

        foreach ($vaciosFisico as $vacio) {
            $cap = (int) $vacio['capacity'];
            if (!in_array($cap, [10, 8, 6])) continue;

            $cond = strtolower(trim($vacio['physical_condition'] ?? ''));
            $own = strtolower(trim($vacio['ownership_type']['name'] ?? $vacio['ownership_type_name'] ?? ''));
            $sup = strtolower(trim($vacio['supplier']['name'] ?? $vacio['supplier_name'] ?? ''));
            $tot = (int) ($vacio['total'] ?? 1);

            $mappedGroup = null;

            if ($cond === 'mala' || $cond === 'bad' || str_contains($own, 'mantenimiento')) {
                $mappedGroup = 'mantenimiento';
            } elseif (str_contains($own, 'desconocido') || str_contains($own, 'produccion') || $own === '') {
                $mappedGroup = 'desconocidos';
            } elseif (str_contains($own, 'linde') || str_contains($sup, 'linde')) {
                $mappedGroup = 'linde';
            } elseif (str_contains($own, 'essalud')) {
                $mappedGroup = 'essalud';
            } elseif (str_contains($own, 'periferi') || str_contains($sup, 'periferi')) {
                $mappedGroup = 'periferia';
            } else {
                // Fallback
                $mappedGroup = 'desconocidos';
            }

            if ($mappedGroup) {
                $reservaVacios[$mappedGroup][$cap] += $tot;
                $reservaVacios['total_und'][$cap] += $tot;
                $reservaVacios['total_und']['all'] += $tot;
            }
        }

        // ==========================================
        // 6. LÍQUIDO - TANQUE CRIO
        // ==========================================
        $readings = \App\Models\DailyReading::whereBetween('reading_date', [$startDateTime, $endDateTime])
            ->orderBy('reading_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();
        
        $refills = \App\Models\LiquidRefill::whereBetween('refilled_at', [$startDateTime, $endDateTime])
            ->get();

        $firstReading = $readings->first();
        $lastReading = $readings->last();
        $previousReading = \App\Models\DailyReading::where('reading_date', '<', $startDateTime)
            ->orderBy('reading_date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        // Saldo Inicial
        $liquidoSaldoInicial = [
            'lectura_anterior' => $previousReading ? (float) $previousReading->tank_level : 0,
            'lectura_actual' => $firstReading ? (float) $firstReading->tank_level : ($previousReading ? (float) $previousReading->tank_level : 0),
            'saldo_inicial_m3' => 0
        ];
        // Factor de conversión M3 indicado en la imagen
        $factor = 55.9; 
        $liquidoSaldoInicial['saldo_inicial_m3'] = round($liquidoSaldoInicial['lectura_actual'] * $factor, 2);

        // Consumo
        // Según imagen: dia actual - dia anterior (del nivel del evaporador)
        $evapAnterior = $previousReading ? (float) $previousReading->evaporator_level : 0;
        $evapActual = $lastReading ? (float) $lastReading->evaporator_level : ($firstReading ? (float) $firstReading->evaporator_level : 0);
        
        $liquidoConsumo = [
            'lectura_anterior' => $evapAnterior,
            'lectura_actual' => $evapActual,
            'consumo_m3' => 0,
            'consumo_hora' => 0
        ];
        
        $liquidoConsumo['consumo_m3'] = round($evapActual - $evapAnterior, 2);
        $liquidoConsumo['consumo_hora'] = round($liquidoConsumo['consumo_m3'] / 24, 8); // 8 decimales según imagen

        // Ingreso
        $inicialIngreso = $refills->first() ? (float) $refills->first()->initial_level : 0;
        $finalIngreso = $refills->last() ? (float) $refills->last()->final_level : 0;
        
        $liquidoIngreso = [
            'inicial' => $inicialIngreso,
            'final' => $finalIngreso,
            'diferencia' => 0,
            'recargado_m3' => 0
        ];
        $liquidoIngreso['diferencia'] = abs($finalIngreso - $inicialIngreso);
        $liquidoIngreso['recargado_m3'] = round($liquidoIngreso['diferencia'] * $factor, 2);

        // Reserva
        $liquidoReserva = [
            'nivel_anterior' => $liquidoSaldoInicial['lectura_actual'], // "dia actual"
            'nivel_actual' => $lastReading ? (float) $lastReading->tank_level : 0, // "nuevo registro"
            'reserva_m3' => 0,
            'proyeccion_dias' => 0
        ];
        $liquidoReserva['reserva_m3'] = round($liquidoReserva['nivel_actual'] * $factor, 2);
        if ($liquidoConsumo['consumo_m3'] > 0) {
            $liquidoReserva['proyeccion_dias'] = round($liquidoReserva['reserva_m3'] / $liquidoConsumo['consumo_m3'], 8); // 8 decimales según imagen
        }

        return response()->json([
            'date' => $date,
            'gaseoso' => [
                'saldo_inicial' => $saldoInicialGas,
                'consumo' => $consumoGas,
                'ingreso' => $ingresoGas,
                'reserva_llenos' => $reservaLlenos,
                'reserva_vacios' => $reservaVacios
            ],
            'liquido' => [
                'saldo_inicial' => $liquidoSaldoInicial,
                'consumo' => $liquidoConsumo,
                'ingreso' => $liquidoIngreso,
                'reserva' => $liquidoReserva
            ]
        ]);
    }
}
