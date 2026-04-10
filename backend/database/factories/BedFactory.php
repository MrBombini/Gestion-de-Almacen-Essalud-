<?php

namespace Database\Factories;

use App\Models\Bed;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class BedFactory extends Factory
{
    protected $model = Bed::class;

    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'bed_number' => $this->faker->numerify('Bed-###'),
            'status'     => 'available',
        ];
    }
}
