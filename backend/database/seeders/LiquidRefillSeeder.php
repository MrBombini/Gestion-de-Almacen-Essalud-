<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LiquidRefillSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('liquid_refills')->insert([
            [
                'supplier_id' => 1, // LINDE PERU
                'level_before' => 25.50,
                'level_after' => 95.00,
                'weight_before' => 1200.00,
                'weight_after' => 4500.00,
                'ticket_amount' => 3300.00,
                'reference_document' => 'GR-001-4589',
                'user_id' => 1, // System Administrator
                'refilled_at' => Carbon::now()->subDays(1)->toDateTimeString(),
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}