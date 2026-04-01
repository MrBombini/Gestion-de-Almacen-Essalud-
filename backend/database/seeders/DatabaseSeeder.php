<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,              // 1. Operarios (todos los técnicos)
            GasTypeSeeder::class,           // 2. Tipos de Gas (Oxígeno, Nitrógeno...)
            ProviderSeeder::class,          // 3. Dueños (Linde, Praxair, EsSalud...)
            LocationSeeder::class,          // 4. Camas, Almacenes y Pacientes PADOMI
            CylinderCapacitySeeder::class,  // 5. Capacidades (1, 6, 10 m3...)
            CylinderModelSeeder::class,     // 6. Marcas (JD, KIOSHI, PRAXAIR...)  ← NUEVO
            PatientSeeder::class,           // 7. Ficha PADOMI (busca ubicaciones del paso 4)
            CylinderSeeder::class,          // 8. Balones (une Gas + Proveedor + Capacidad + Modelo)
        ]);
    }
}
