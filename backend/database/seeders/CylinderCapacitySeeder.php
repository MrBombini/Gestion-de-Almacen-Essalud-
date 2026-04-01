<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CylinderCapacity;

class CylinderCapacitySeeder extends Seeder
{
    public function run(): void
    {
        $capacities = [
            ['value' => 1.00, 'unit' => 'm3', 'description' => 'Balón Pequeño'],
            ['value' => 3.00, 'unit' => 'm3', 'description' => 'Balón Mediano'],
            ['value' => 6.00, 'unit' => 'm3', 'description' => 'Balón Grande'],
            ['value' => 8.00, 'unit' => 'm3', 'description' => 'Balón Extra Grande'],
            ['value' => 10.00, 'unit' => 'm3', 'description' => 'Cilindro Industrial'],
        ];

        foreach ($capacities as $capacity) {
            CylinderCapacity::create($capacity);
        }
    }
}
