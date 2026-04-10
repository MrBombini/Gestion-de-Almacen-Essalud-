<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::create(['name' => 'LINDE PERU', 'description' => 'Principal oxygen supplier']);
        Supplier::create(['name' => 'AIR PRODUCTS', 'description' => 'Alternative gas supplier']);
        Supplier::create(['name' => 'ESSALUD CENTRAL', 'description' => 'Internal warehouse']);
    }
}
