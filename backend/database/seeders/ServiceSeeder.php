<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('services')->insert([
            ['name' => 'UCI', 'type' => 'Hospital', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'EMERGENCIA', 'type' => 'Hospital', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'ONCOLOGIA', 'type' => 'Hospital', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'PADOMI', 'type' => 'PADOMI', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'MANIFOLD 1', 'type' => 'Interno', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}