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
     */
    private function calculateEstimatedHours(float $pressurePsi, float $flowLmin, float $capacityM3): float
    {
        $caps = array_keys(self::VOLUME_MAP);
        usort($caps, fn($a, $b) => abs($a - $capacityM3) <=> abs($b - $capacityM3));
        $closestCap = $caps[0];

        $volumeLitros = self::VOLUME_MAP[$closestCap] ?? 50;
        $pressureBar  = $pressurePsi / 14.5038;

        // Tiempo (horas) = (Volumen_L × Presión_Bar) / (Flujo_L·min⁻¹ × 60)
        if ($flowLmin <= 0) return 0;
        return round(($volumeLitros * $pressureBar) / ($flowLmin * 60), 2);
    }

    // =========================================================
    // GET /hospitalization/cylinders
    // Lista cilindros en HOSPITALIZACION con su última lectura
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

        // Adjuntar última lectura a cada cilindro
        $cylinders = $cylinders->map(function ($cyl) {
            $lastReading = HospitalizationReading::where('cylinder_id', $cyl->id)
                ->orderByDesc('read_at')
                ->first();

            $cyl->last_reading = $lastReading ? [
                'pressure_psi'    => $lastReading->pressure_psi,
                'flow_lmin'       => $lastReading->flow_lmin,
                'estimated_hours' => $lastReading->estimated_hours,
                'shift'           => $lastReading->shift,
                'read_at'         => $lastReading->read_at,
                'user'            => $lastReading->user?->name,
            ] : null;

            return $cyl;
        });

        return response()->json($cylinders);
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
            'flow_lmin'    => 'required|numeric|min:0.01',
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
            'message'         => 'Lectura registrada correctamente.',
            'estimated_hours' => $estimatedHours,
            'reading'         => $reading,
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
