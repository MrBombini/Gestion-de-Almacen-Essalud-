<?php

namespace Database\Factories;

use App\Models\Cylinder;
use App\Models\Supplier;
use App\Models\OwnershipType;
use Illuminate\Database\Eloquent\Factories\Factory;

class CylinderFactory extends Factory
{
    protected $model = Cylinder::class;

    public function definition(): array
    {
        return [
            'serial_number'         => $this->faker->unique()->bothify('CYL-#####'),
            'supplier_id'          => Supplier::inRandomOrder()->first()->id ?? Supplier::factory(),
            'ownership_type_id'    => OwnershipType::inRandomOrder()->first()->id ?? OwnershipType::factory(),
            'gas_type'              => 'OXYGEN',
            'capacity'              => $this->faker->randomElement([1, 3.45, 6, 10]),
            'status'                => $this->faker->randomElement(['full', 'empty', 'in_use']),
            'hydrostatic_test_date' => $this->faker->dateTimeBetween('now', '+5 years'),
            'physical_condition'    => 'Good',
        ];
    }
}
