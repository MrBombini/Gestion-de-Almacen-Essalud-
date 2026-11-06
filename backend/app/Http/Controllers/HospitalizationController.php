<?php

namespace App\Http\Controllers;

use App\Models\Cylinder;
use App\Models\Bed;
use App\Models\Service;
use App\Models\HospitalizationReading;
use App\Models\BedCylinderTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class HospitalizationController extends Controller
{
    // =========================================================
    // MAPA: capacidad (m³) → volumen water del cilindro (L)
    // =========================================================
    private const VOLUME_MAP = [
        2  => 12,
        4  => 23,
        6  => 35,
        8  => 47,
        10 => 58,
        14 => 80,
        40 => 200,
    ];

    /**
     * Calcula el tiempo estimado en horas dado presión (PSI), flujo (L/min) y capacidad (m³).
     * Devuelve null cuando el flujo es 0 (balón no en uso activo), para que el frontend
     * muestre '—' en lugar de '0h (Agotado)'.
     */
    private function calculateEstimatedHours(float $pressurePsi, float $flowLmin, float $capacityM3): ?float
    {
        // Flujo 0 = balón conectado pero sin uso activo (no es un agotado)
        if ($flowLmin <= 0) return null;

        $caps = array_keys(self::VOLUME_MAP);
        usort($caps, fn($a, $b) => abs($a - $capacityM3) <=> abs($b - $capacityM3));
        $closestCap = $caps[0];

        $volumeLitros = self::VOLUME_MAP[$closestCap] ?? 50;
        $pressureBar  = $pressurePsi / 14.5038;

        // Tiempo (horas) = (Volumen_L × Presión_Bar) / (Flujo_L·min⁻¹ × 60)
        return round(($volumeLitros * $pressureBar) / ($flowLmin * 60), 2);
    }

    /**
     * Calcula la autonomía restante en tiempo real a partir de una lectura.
     *
     * @param HospitalizationReading|null $reading
     * @return array
     */
    private function getReadingAutonomy(?HospitalizationReading $reading): array
    {
        if (!$reading) {
            return [
                'initial_estimated_hours' => null,
                'elapsed_hours'           => 0,
                'remaining_hours'         => null,
                'status'                  => 'no_data',
                'needs_change'            => false,
            ];
        }

        // Si no hay flujo (<= 0 o null) o no se calculó autonomía (balón sin uso activo)
        $flow = $reading->flow_lmin !== null ? (float) $reading->flow_lmin : 0;
        if ($flow <= 0 || $reading->estimated_hours === null) {
            return [
                'initial_estimated_hours' => null,
                'elapsed_hours'           => 0,
                'remaining_hours'         => null,
                'status'                  => 'no_flow',
                'needs_change'            => false,
            ];
        }

        $initialHours = (float) $reading->estimated_hours;
        $readAt = $reading->read_at ? Carbon::parse($reading->read_at) : Carbon::now();
        $now = Carbon::now();

        // Diferencia en segundos entre la lectura y el momento actual
        $diffSeconds = $readAt->diffInSeconds($now, false);
        $elapsedHours = $diffSeconds > 0 ? ($diffSeconds / 3600) : 0;

        $remainingHours = max(0, round($initialHours - $elapsedHours, 2));

        $status = 'ok';
        if ($remainingHours <= 0) {
            $status = 'depleted'; // Agotado
        } elseif ($remainingHours <= 1.0) {
            $status = 'critical'; // Crítico: menos de 1 hora
        } elseif ($remainingHours <= 2.0) {
            $status = 'warning'; // Alerta: 1 a 2 horas (cambio preventivo)
        }

        return [
            'initial_estimated_hours' => $initialHours,
            'elapsed_hours'           => round($elapsedHours, 2),
            'remaining_hours'         => $remainingHours,
            'status'                  => $status,
            'needs_change'            => $remainingHours <= 2.0,
        ];
    }

    // =========================================================
    // GET /hospitalization/cylinders
    // Lista cilindros en HOSPITALIZACION con su última lectura y autonomía dinámica
    // =========================================================
    public function index()
    {
        $cylinders = Cylinder::with([
            'currentService',
            'currentBed',
            'ownershipType',
            'supplier',
        ])
        ->where('location', 'HOSPITALIZACION')
        ->whereNull('deleted_at')
        ->orderBy('current_service_id')
        ->orderBy('current_bed_id')
        ->get();

        // Adjuntar última lectura a cada cilindro con cálculo dinámico
        $cylinders = $cylinders->map(function ($cyl) {
            $lastReading = HospitalizationReading::where('cylinder_id', $cyl->id)
                ->orderByDesc('read_at')
                ->first();

            if ($lastReading) {
                $autonomy = $this->getReadingAutonomy($lastReading);
                $cyl->last_reading = [
                    'pressure_psi'            => $lastReading->pressure_psi,
                    'flow_lmin'               => $lastReading->flow_lmin,
                    'estimated_hours'         => $autonomy['remaining_hours'], // Autonomía dinámica en tiempo real
                    'initial_estimated_hours' => $autonomy['initial_estimated_hours'],
                    'remaining_hours'         => $autonomy['remaining_hours'],
                    'elapsed_hours'           => $autonomy['elapsed_hours'],
                    'status'                  => $autonomy['status'],
                    'needs_change'            => $autonomy['needs_change'],
                    'shift'                   => $lastReading->shift,
                    'read_at'                 => $lastReading->read_at,
                    'user'                    => $lastReading->user?->name,
                ];
            } else {
                $cyl->last_reading = null;
            }

            return $cyl;
        });

        return response()->json($cylinders);
    }

    // =========================================================
    // GET /hospitalization/alerts
    // Lista cilindros que requieren recambio urgente (autonomía ≤ 2 horas)
    // =========================================================
    public function alerts()
    {
        $cylinders = Cylinder::with([
            'currentService',
            'currentBed',
            'ownershipType',
            'supplier',
        ])
        ->where('location', 'HOSPITALIZACION')
        ->whereNotNull('current_bed_id')
        ->whereNull('deleted_at')
        ->get();

        $alertList = [];
        $criticalCount = 0;
        $warningCount  = 0;
        $depletedCount = 0;

        foreach ($cylinders as $cyl) {
            $lastReading = HospitalizationReading::where('cylinder_id', $cyl->id)
                ->orderByDesc('read_at')
                ->first();

            if (!$lastReading) {
                continue;
            }

            $autonomy = $this->getReadingAutonomy($lastReading);

            if ($autonomy['needs_change']) {
                if ($autonomy['status'] === 'critical') $criticalCount++;
                elseif ($autonomy['status'] === 'warning') $warningCount++;
                elseif ($autonomy['status'] === 'depleted') $depletedCount++;

                $alertList[] = [
                    'cylinder_id'             => $cyl->id,
                    'serial_number'           => $cyl->serial_number,
                    'capacity'                => $cyl->capacity,
                    'bed_number'              => $cyl->currentBed?->bed_number,
                    'service_name'            => $cyl->currentService?->name,
                    'pressure_psi'            => $lastReading->pressure_psi,
                    'flow_lmin'               => $lastReading->flow_lmin,
                    'initial_estimated_hours' => $autonomy['initial_estimated_hours'],
                    'remaining_hours'         => $autonomy['remaining_hours'],
                    'elapsed_hours'           => $autonomy['elapsed_hours'],
                    'status'                  => $autonomy['status'],
                    'read_at'                 => $lastReading->read_at,
                ];
            }
        }

        // Ordenar por menor tiempo restante (los más urgentes primero)
        usort($alertList, fn($a, $b) => $a['remaining_hours'] <=> $b['remaining_hours']);

        return response()->json([
            'total_alerts'   => count($alertList),
            'critical_count' => $criticalCount,
            'warning_count'  => $warningCount,
            'depleted_count' => $depletedCount,
            'alerts'         => $alertList,
        ]);
    }

    // =========================================================
    // POST /hospitalization/readings
    // Guarda lectura de presión + flujo y calcula autonomía
    // =========================================================
    public function storeReading(Request $request)
    {
        $validated = $request->validate([
            'cylinder_id'  => 'required|exists:cylinders,id',
            'pressure_psi' => 'required|numeric|min:0',
            'flow_lmin'    => 'required|numeric|min:0',   // 0 = balón sin flujo activo (no en uso)
            'shift'        => 'required|string|in:Morning,Afternoon,Night',
            'notes'        => 'nullable|string|max:500',
        ]);

        $cylinder = Cylinder::findOrFail($validated['cylinder_id']);
        $estimatedHours = $this->calculateEstimatedHours(
            (float) $validated['pressure_psi'],
            (float) $validated['flow_lmin'],
            (float) ($cylinder->capacity ?? 10)
        );

        $reading = HospitalizationReading::create([
            'cylinder_id'     => $validated['cylinder_id'],
            'service_id'      => $cylinder->current_service_id,
            'bed_id'          => $cylinder->current_bed_id,
            'user_id'         => Auth::id(),
            'shift'           => $validated['shift'],
            'pressure_psi'    => $validated['pressure_psi'],
            'flow_lmin'       => $validated['flow_lmin'],
            'estimated_hours' => $estimatedHours,
            'notes'           => $validated['notes'] ?? null,
            'read_at'         => Carbon::now(),
        ]);

        return response()->json([
            'message'                 => 'Lectura registrada correctamente.',
            'estimated_hours'         => $estimatedHours,          // null si flujo=0
            'initial_estimated_hours' => $estimatedHours,
            'remaining_hours'         => $estimatedHours,
            'reading'                 => $reading,
        ], 201);
    }

    // =========================================================
    // GET /hospitalization/readings/{cylinderId}
    // Historial de lecturas de un cilindro (últimas 20)
    // =========================================================
    public function readingHistory($cylinderId)
    {
        $readings = HospitalizationReading::with('user', 'bed', 'service')
            ->where('cylinder_id', $cylinderId)
            ->orderByDesc('read_at')
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'id'              => $r->id,
                'shift'           => $r->shift,
                'pressure_psi'    => $r->pressure_psi,
                'flow_lmin'       => $r->flow_lmin,
                'estimated_hours' => $r->estimated_hours,
                'notes'           => $r->notes,
                'read_at'         => $r->read_at,
                'bed_number'      => $r->bed?->bed_number,
                'service_name'    => $r->service?->name,
                'user_name'       => $r->user?->name,
            ]);

        return response()->json($readings);
    }

    // =========================================================
    // POST /hospitalization/bed-transfer
    // Traslada un cilindro de una cama a otra y actualiza cylinders
    // =========================================================
    public function bedTransfer(Request $request)
    {
        $validated = $request->validate([
            'cylinder_id'    => 'required|exists:cylinders,id',
            'to_bed_id'      => 'required|exists:beds,id',
            'to_service_id'  => 'nullable|exists:services,id',
            'shift'          => 'required|string|in:Morning,Afternoon,Night',
            'notes'          => 'nullable|string|max:500',
        ]);

        $cylinder = Cylinder::findOrFail($validated['cylinder_id']);

        // Registrar el traslado en el log
        $transfer = BedCylinderTransfer::create([
            'cylinder_id'     => $cylinder->id,
            'from_bed_id'     => $cylinder->current_bed_id,
            'to_bed_id'       => $validated['to_bed_id'],
            'from_service_id' => $cylinder->current_service_id,
            'to_service_id'   => $validated['to_service_id'] ?? null,
            'user_id'         => Auth::id(),
            'shift'           => $validated['shift'],
            'notes'           => $validated['notes'] ?? null,
            'transferred_at'  => Carbon::now(),
        ]);

        // Actualizar la cama y servicio actual del cilindro
        $cylinder->update([
            'current_bed_id'     => $validated['to_bed_id'],
            'current_service_id' => $validated['to_service_id'] ?? $cylinder->current_service_id,
        ]);

        return response()->json([
            'message'  => 'Cilindro trasladado correctamente.',
            'transfer' => $transfer,
        ], 201);
    }

    // =========================================================
    // GET /hospitalization/bed-transfer/{cylinderId}
    // Historial de traslados de un cilindro
    // =========================================================
    public function transferHistory($cylinderId)
    {
        $transfers = BedCylinderTransfer::with('user', 'fromBed', 'toBed', 'fromService', 'toService')
            ->where('cylinder_id', $cylinderId)
            ->orderByDesc('transferred_at')
            ->limit(20)
            ->get()
            ->map(fn($t) => [
                'id'               => $t->id,
                'from_bed'         => $t->fromBed?->bed_number,
                'to_bed'           => $t->toBed?->bed_number,
                'from_service'     => $t->fromService?->name,
                'to_service'       => $t->toService?->name,
                'shift'            => $t->shift,
                'notes'            => $t->notes,
                'transferred_at'   => $t->transferred_at,
                'user_name'        => $t->user?->name,
            ]);

        return response()->json($transfers);
    }
}
