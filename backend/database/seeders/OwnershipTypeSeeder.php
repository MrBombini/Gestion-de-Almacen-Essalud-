<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OwnershipType;

class OwnershipTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['EsSalud', 'Provider', 'Patient'];

        foreach ($types as $name) {
            OwnershipType::create(['name' => $name]);
        }
    }
}
