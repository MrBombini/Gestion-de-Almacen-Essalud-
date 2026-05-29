<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PrescriptionSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('prescriptions')->insert([
            [
                'patient_id' => 1,
                'service_id' => null,
                'dosage' => '2 litros / min',
                'usage_time' => '15 horas al día',
                'issued_at' => Carbon::now()->subDays(2)->toDateString(),
                'expires_at' => Carbon::now()->addDays(28)->toDateString(),
                'authorization_date' => Carbon::now()->subDays(2)->toDateString(),
                'promissory_note' => 'PAG-001',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}