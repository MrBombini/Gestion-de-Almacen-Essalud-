<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BedSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('beds')->insert([
            ['service_id' => 1, 'bed_number' => 'UCI-01', 'status' => 'available', 'created_at' => $now, 'updated_at' => $now],
            ['service_id' => 1, 'bed_number' => 'UCI-02', 'status' => 'occupied', 'created_at' => $now, 'updated_at' => $now],
            ['service_id' => 3, 'bed_number' => '185', 'status' => 'occupied', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}