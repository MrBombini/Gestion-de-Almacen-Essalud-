<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // Lista de archivos en el orden correcto de inserción
        $files = [
            'propiedad.sql',         // Proveedores (suppliers)
            'modelo.sql',            // Tipos de propiedad (ownership_types)
            'services.sql',          // Servicios (services)
            'pacientes.sql',         // Pacientes (patients)
            'prescriptions.sql',     // Recetas (prescriptions)
            'cilindros.sql',         // Cilindros generales
            'cilindrosPaciente.sql', // Cilindros asignados a pacientes
        ];

        // 1. APAGAR las llaves foráneas para que no valide duplicados ni relaciones rotas temporalmente
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($files as $file) {
            $path = database_path("seeders/sql/{$file}");

            if (File::exists($path)) {
                $this->command->info("Insertando datos desde: {$file}");

                // Trunca (vacía) la tabla correspondiente antes de insertar para evitar el "Duplicate entry"
                // Deduce el nombre de la tabla aproximado según el archivo
                if ($file === 'propiedad.sql') DB::table('suppliers')->truncate();
                if ($file === 'modelo.sql') DB::table('ownership_types')->truncate();
                if ($file === 'services.sql') DB::table('services')->truncate();
                if ($file === 'pacientes.sql') DB::table('patients')->truncate();
                if ($file === 'prescriptions.sql') DB::table('prescriptions')->truncate();
                if ($file === 'cilindros.sql') DB::table('cylinders')->truncate();

                // Ejecuta el SQL directamente
                DB::unprepared(File::get($path));
            } else {
                $this->command->warn("El archivo {$file} no fue encontrado.");
            }
        }

        // 2. VOLVER A PRENDER las llaves foráneas
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
