<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('patients')->insert([
            [
                'full_name' => 'Carlos Mendoza', 
                'dni' => '12345678', 
                'trasiego_code' => 'P120-001', 
                'exchange_code' => '2325-001', 
                'created_at' => $now, 
                'updated_at' => $now
            ],
            [
                'full_name' => 'Maria Fernandez', 
                'dni' => '87654321', 
                'trasiego_code' => null, 
                'exchange_code' => '2325-002', 
                'created_at' => $now, 
                'updated_at' => $now
            ],
        ]);
    }
}