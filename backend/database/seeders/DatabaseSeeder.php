<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Solo carga los usuarios iniciales.
     * El resto de datos maestros (Tipos de Propiedad, Proveedores, Servicios)
     * se gestionan desde los CRUDs del sistema.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
        ]);
    }
}
