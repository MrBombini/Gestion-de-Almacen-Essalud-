<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            // --- Servicios del Hospital ---
            ['serv' => 'ONCOLOGÍA',           'id' => '158',    'code' => 'onco158',    'type' => 'Hospital'],
            ['serv' => 'GINECOLOGÍA',          'id' => '181',    'code' => 'gine181',    'type' => 'Hospital'],
            ['serv' => 'TRAUMATOLOGÍA',        'id' => '146',    'code' => 'trauma146',  'type' => 'Hospital'],
            ['serv' => 'TRAUMACOVID',          'id' => 'TC1',    'code' => 'tc1',        'type' => 'Hospital'],
            ['serv' => 'MEDICINA INTERNA',     'id' => 'MI',     'code' => 'mi',         'type' => 'Hospital'],
            ['serv' => 'VILLA METROPOLITANO',  'id' => 'VM',     'code' => 'vm',         'type' => 'Hospital'],
            ['serv' => 'CENTRO QUIRÚRGICO',    'id' => 'CQ',     'code' => 'cq',         'type' => 'Hospital'],
            ['serv' => 'MANIFOLD 2',           'id' => 'M2',     'code' => 'm2',         'type' => 'Hospital'],

            // --- Almacenes ---
            ['serv' => 'ALMACÉN CENTRAL',      'id' => 'ALMCEN', 'code' => 'almcen',     'type' => 'Warehouse'],
            ['serv' => 'TALLER',               'id' => 'TALLER', 'code' => 'taller',     'type' => 'Warehouse'],

            // --- Pacientes PADOMI (usados por PatientSeeder) ---
            ['serv' => 'Silva Santander Jose Angel',    'id' => '823',  'code' => 'P823',  'type' => 'Patient'],
            ['serv' => 'Lordan Talaverano Nolberta',    'id' => '2766', 'code' => 'P2766', 'type' => 'Patient'],
            ['serv' => 'Caro Palavicini Carmen Julia',  'id' => '1216', 'code' => 'P1216', 'type' => 'Patient'],
        ];

        foreach ($locations as $l) {
            DB::table('locations')->insert([
                'service_name' => $l['serv'],
                'identifier'   => $l['id'],
                'short_code'   => $l['code'],
                'type'         => $l['type'],
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
    }
}
