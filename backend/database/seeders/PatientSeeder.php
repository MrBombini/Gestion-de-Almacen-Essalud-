<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Location;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        // Las ubicaciones ya fueron creadas por LocationSeeder
        // Solo las buscamos por short_code
        $loc1 = Location::where('short_code', 'P823')->first();
        $loc2 = Location::where('short_code', 'P2766')->first();
        $loc3 = Location::where('short_code', 'P1216')->first();

        Patient::create([
            'patient_code'        => '823',
            'name'                => 'Silva Santander Jose Angel',
            'dni'                 => '10203040',
            'location_id'         => $loc1->id,
            'loan_expiration_date'=> now()->addDays(30),
        ]);

        Patient::create([
            'patient_code'        => '2766',
            'name'                => 'Lordan Talaverano Nolberta',
            'dni'                 => '50607080',
            'location_id'         => $loc2->id,
            'loan_expiration_date'=> now()->addDays(15),
        ]);

        Patient::create([
            'patient_code'        => '1216',
            'name'                => 'Caro Palavicini Carmen Julia',
            'dni'                 => '90807060',
            'location_id'         => $loc3->id,
            'loan_expiration_date'=> now()->subDays(2), // Ya venció → semáforo ROJO 🔴
        ]);
    }
}
