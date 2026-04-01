<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GasTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Oxígeno Medicinal', 'unit' => 'm3', 'min_stock' => 50],
            ['name' => 'Nitrógeno Medicinal', 'unit' => 'm3', 'min_stock' => 10],
            ['name' => 'Óxido Nitroso', 'unit' => 'kg', 'min_stock' => 5],
        ];

        foreach ($types as $t) {
            DB::table('gas_types')->insert($t);
        }
    }
}
