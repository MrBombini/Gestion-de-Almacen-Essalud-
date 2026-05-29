<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OwnershipTypeSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('ownership_types')->insert([
            ['name' => 'EsSalud', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Proveedor', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Paciente', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}