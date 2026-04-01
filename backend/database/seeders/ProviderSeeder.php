<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProviderSeeder extends Seeder
{
    public function run(): void
    {
        $providers = [
            'LINDE PERÚ', 'PRAXAIR', 'OXICUSCO', 'KIOSHI PRO', 'JD', 'YA', 'ESSALUD', 'B. PROPIO'
        ];

        foreach ($providers as $p) {
            DB::table('providers')->insert([
                'company_name' => $p,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
