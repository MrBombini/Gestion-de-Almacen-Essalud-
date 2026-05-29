<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DailyReadingSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $yesterday = Carbon::now()->subDays(1)->toDateString();
        
        DB::table('daily_readings')->insert([
            [
                'reading_date' => $yesterday,
                'shift' => 'Morning',
                'tank_level' => 95.00,
                'flow_meter_reading' => 15420.50,
                'calculated_consumption' => 0.00, // Lectura inicial
                'user_id' => 2, // Operador
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'reading_date' => $yesterday,
                'shift' => 'Night',
                'tank_level' => 88.50,
                'flow_meter_reading' => 15580.00,
                'calculated_consumption' => 159.50, // Consumo del día
                'user_id' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}