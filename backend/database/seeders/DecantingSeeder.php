<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DecantingSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('decantings')->insert([
            [
                'cylinder_id' => 3, // El cilindro vacío que dejó el paciente en el intercambio
                'service_id' => 5, // MANIFOLD 1
                'patient_id' => null,
                'prescription_id' => null,
                'manual_destination' => 'Stock Almacén',
                'refilled_amount' => 3.45,
                'shift' => 'Afternoon',
                'user_id' => 2, // Operador
                'decanted_at' => Carbon::now()->subHour()->toDateTimeString(),
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}