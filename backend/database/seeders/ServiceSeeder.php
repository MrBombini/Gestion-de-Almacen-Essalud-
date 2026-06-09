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
            ['name' => 'UCI', 'type' => 'Hospital', 'abbreviation' => 'UCI', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'EMERGENCIA', 'type' => 'Hospital', 'abbreviation' => 'EMERGENCIA', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'ONCOLOGIA', 'type' => 'Hospital', 'abbreviation' => 'ONCOLOGIA', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'PADOMI', 'type' => 'PADOMI', 'abbreviation' => 'PADOMI', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'MANIFOLD 1', 'type' => 'Interno', 'abbreviation' => 'MANIFOLD 1', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
