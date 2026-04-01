<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MedicalGasSeeder extends Seeder
{
    public function run(): void
    {
        // 1. USUARIOS (Tus Técnicos Reales)
        $users = [
            ['code' => '444', 'name' => 'ELISBAN CCOHUA HUAMANGUILLA', 'role' => 'technician'],
            ['code' => '102', 'name' => 'FREDY TICUÑA LAURA', 'role' => 'technician'],
            ['code' => '106', 'name' => 'FERMIN CCASA QUISPE', 'role' => 'technician'],
            ['code' => '103', 'name' => 'MATEO ARELA RAMOS', 'role' => 'technician'],
            ['code' => '111', 'name' => 'KEVIN JHONSON QUISPE HUAMÁN', 'role' => 'technician'],
            ['code' => '001', 'name' => 'INGENIERO ADMINISTRADOR', 'role' => 'engineer'], // Jefe
        ];

        foreach ($users as $u) {
            DB::table('users')->insert([
                'operator_code' => $u['code'],
                'name' => $u['name'],
                'password' => Hash::make('password123'), // Password temporal
                'role' => $u['role'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. TIPOS DE GAS
        $gasTypes = [
            ['name' => 'Oxígeno Medicinal', 'unit' => 'm3', 'min_stock' => 50],
            ['name' => 'Nitrógeno Medicinal', 'unit' => 'm3', 'min_stock' => 10],
            ['name' => 'Óxido Nitroso', 'unit' => 'kg', 'min_stock' => 5],
        ];

        foreach ($gasTypes as $gt) {
            DB::table('gas_types')->insert($gt);
        }

        // 3. PROVEEDORES Reales
        $providers = [
            'PRAXAIR', 'LINDE PERÚ', 'OXICUSCO', 'KIOSHI PRO', 'ESSALUD', 'B. PROPIO'
        ];

        foreach ($providers as $p) {
            DB::table('providers')->insert([
                'company_name' => $p,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. UBICACIONES Reales (Hospital y Servicios)
        $locations = [
            ['full' => 'MANIFOLD 2', 'short' => 'M2', 'type' => 'Hospital'],
            ['full' => 'MANIFOLD 1', 'short' => 'M1', 'type' => 'Hospital'],
            ['full' => 'RED DE OXIGENO', 'short' => 'RED', 'type' => 'Hospital'],
            ['full' => 'ONCOLOGÍA CAMA 158', 'short' => '158', 'type' => 'Hospital'],
            ['full' => 'GINECOLOGÍA CAMA 181', 'short' => '181', 'type' => 'Hospital'],
            ['full' => 'TRAUMATOLOGÍA CAMA 146', 'short' => '146', 'type' => 'Hospital'],
            ['full' => 'TRAUMACOVID CAMA 1', 'short' => 'TC1', 'type' => 'Hospital'],
            ['full' => 'ALMACÉN CENTRAL', 'short' => 'ALM_CEN', 'type' => 'Warehouse'],
        ];

        foreach ($locations as $l) {
            DB::table('locations')->insert([
                'full_name' => $l['full'],
                'short_code' => $l['short'],
                'type' => $l['type'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 5. CILINDROS Reales de prueba (según tus códigos del Excel)
        $cylinders = [
            ['barcode' => 'P125037', 'cap' => 10, 'owner' => 'PRAXAIR'],
            ['barcode' => 'P967019', 'cap' => 10, 'owner' => 'PRAXAIR'],
            ['barcode' => '1524768', 'cap' => 10, 'owner' => 'PRAXAIR'],
            ['barcode' => 'N901129', 'cap' => 10, 'owner' => 'KIOSHI PRO'],
            ['barcode' => '20X279178', 'cap' => 10, 'owner' => 'ESSALUD'],
        ];

        foreach ($cylinders as $c) {
            DB::table('cylinders')->insert([
                'barcode' => $c['barcode'],
                'gas_type_id' => 1, // Oxigeno Medicinal
                'asset_type' => 'Cylinder',
                'capacity' => $c['cap'],
                'ownership' => $c['owner'],
                'status' => 'Full',
                'current_location_id' => 8, // Todos empiezan en Almacen Central
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
