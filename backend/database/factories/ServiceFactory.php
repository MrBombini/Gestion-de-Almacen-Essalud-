<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->randomElement(['UCI', 'ONCOLOGY', 'MANIFOLD', 'EMERGENCY', 'OPERATING ROOM']),
            'type' => $this->faker->randomElement(['Hospital', 'PADOMI']),
        ];
    }
}
