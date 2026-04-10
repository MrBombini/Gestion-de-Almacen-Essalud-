<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Master Data Seeders
        $this->call([
            OwnershipTypeSeeder::class,
            UserSeeder::class,
            SupplierSeeder::class,
        ]);

        // 2. Patients (5)
        \App\Models\Patient::factory(5)->create();

        // 3. Services (3) with 5 Beds each
        \App\Models\Service::factory(3)
            ->has(\App\Models\Bed::factory()->count(5))
            ->create();

        // 4. Cylinders (20)
        \App\Models\Cylinder::factory(20)->create();
    }
}
