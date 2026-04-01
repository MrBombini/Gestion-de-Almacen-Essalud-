<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CylinderModelSeeder extends Seeder
{
    public function run(): void
    {
        // Marcas/Modelos de cilindros vistas en el Excel de EsSalud
        $models = ['JD', 'KIOSHI', 'PRAXAIR', 'LUXFER', 'SINTRA', 'WORTHINGTON'];

        foreach ($models as $name) {
            DB::table('cylinder_models')->insert([
                'name'       => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
