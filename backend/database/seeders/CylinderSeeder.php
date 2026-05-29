<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CylinderSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('cylinders')->insert([
            [
                'serial_number' => 'CYL-10082',
                'barcode' => 'BC-10082',
                'supplier_id' => 3, // EsSalud Central
                'ownership_type_id' => 1, // EsSalud
                'patient_id' => null,
                'service_id' => null,
                'gas_type' => 'OXYGEN',
                'capacity' => 10.00,
                'status' => 'full',
                'hydrostatic_test_date' => Carbon::now()->addYears(4)->toDateString(),
                'physical_condition' => 'Good',
                'location' => 'CENTRAL',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'serial_number' => 'CYL-79520',
                'barcode' => 'BC-79520',
                'supplier_id' => 1, // LINDE
                'ownership_type_id' => 2, // Proveedor
                'patient_id' => null,
                'service_id' => null,
                'gas_type' => 'OXYGEN',
                'capacity' => 6.00,
                'status' => 'empty',
                'hydrostatic_test_date' => Carbon::now()->addYears(2)->toDateString(),
                'physical_condition' => 'Good',
                'location' => 'ALMACEN',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'serial_number' => 'CYL-99999',
                'barcode' => 'BC-99999',
                'supplier_id' => 3, 
                'ownership_type_id' => 3, // Paciente
                'patient_id' => 1,
                'service_id' => null,
                'gas_type' => 'OXYGEN',
                'capacity' => 3.45,
                'status' => 'in_use',
                'hydrostatic_test_date' => Carbon::now()->addYears(5)->toDateString(),
                'physical_condition' => 'Good',
                'location' => 'PADOMI',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}