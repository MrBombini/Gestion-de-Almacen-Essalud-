<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('suppliers')->insert([
            [
                'name' => 'LINDE PERU', 
                'ruc' => '20100000001', 
                'description' => 'Proveedor principal de oxígeno',
                'created_at' => $now, 
                'updated_at' => $now
            ],
            [
                'name' => 'PRAXAIR', 
                'ruc' => '20100000002', 
                'description' => 'Proveedor secundario',
                'created_at' => $now, 
                'updated_at' => $now
            ],
            [
                'name' => 'ESSALUD CENTRAL', 
                'ruc' => null, 
                'description' => 'Almacén interno',
                'created_at' => $now, 
                'updated_at' => $now
            ],
        ]);
    }
}