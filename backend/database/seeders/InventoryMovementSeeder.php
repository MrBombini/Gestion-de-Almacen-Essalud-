<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryMovementSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('inventory_movements')->insert([
            [
                'id' => 1,
                'type' => 'Exchange',
                'shift' => 'Morning',
                'reference_document' => null,
                'supplier_id' => null,
                'patient_id' => 1, // Carlos Mendoza
                'service_id' => null,
                'bed_id' => null,
                'prescription_id' => 1,
                'user_id' => 2, // Operador
                'movement_at' => Carbon::now()->subHours(5)->toDateTimeString(),
                'notes' => 'Intercambio regular de paciente',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 2,
                'type' => 'SupplierEntry',
                'shift' => 'Afternoon',
                'reference_document' => 'GR-PROV-999',
                'supplier_id' => 1, // LINDE PERU
                'patient_id' => null,
                'service_id' => null,
                'bed_id' => null,
                'prescription_id' => null,
                'user_id' => 1, // Admin
                'movement_at' => Carbon::now()->subHours(2)->toDateTimeString(),
                'notes' => 'Ingreso de cilindros recargados',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}