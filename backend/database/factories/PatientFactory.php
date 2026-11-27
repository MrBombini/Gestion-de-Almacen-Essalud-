<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'full_name'     => $this->faker->name(),
            'dni'           => $this->faker->unique()->numerify('########'),
            'trasiego_code' => $this->faker->optional(0.7)->bothify('T-###'),
            'exchange_code' => $this->faker->optional(0.5)->bothify('E-###'),
        ];
    }
}
