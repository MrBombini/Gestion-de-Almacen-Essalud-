<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CylinderMovementSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('cylinder_movements')->insert([
            // Detalles de la Operación 1 (Intercambio Paciente)
            [
                'inventory_movement_id' => 1,
                'cylinder_id' => 3, // Cilindro del paciente que entra vacío
                'action' => 'Entry',
                'cylinder_status' => 'empty',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'inventory_movement_id' => 1,
                'cylinder_id' => 1, // Cilindro del almacén que sale lleno
                'action' => 'Exit',
                'cylinder_status' => 'full',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Detalles de la Operación 2 (Entrada Proveedor)
            [
                'inventory_movement_id' => 2,
                'cylinder_id' => 2, // Cilindro del proveedor que entra lleno
                'action' => 'Entry',
                'cylinder_status' => 'full',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}