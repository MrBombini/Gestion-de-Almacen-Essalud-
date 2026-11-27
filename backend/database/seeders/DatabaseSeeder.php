<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            //OwnershipTypeSeeder::class,
            //ServiceSeeder::class,
            //SupplierSeeder::class,
            //PatientSeeder::class,
            //BedSeeder::class,
            //CylinderSeeder::class,
            //PrescriptionSeeder::class,
            //LiquidRefillSeeder::class,
            //DailyReadingSeeder::class,
            //InventoryMovementSeeder::class,
            //CylinderMovementSeeder::class,
            //DecantingSeeder::class,
            InitialDataSeeder::class,
        ]);
    }
}
