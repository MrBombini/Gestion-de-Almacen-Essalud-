<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Asignar correlativo retroactivo a las devoluciones de paciente que aún no tengan attention_number
        $pendingReturns = DB::table('inventory_movements')
            ->where('type', 'PatientReturn')
            ->whereNotNull('patient_id')
            ->whereNull('attention_number')
            ->whereNull('deleted_at')
            ->orderBy('movement_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        if ($pendingReturns->isNotEmpty()) {
            $maxAttention = DB::table('inventory_movements')
                ->whereNotNull('attention_number')
                ->max('attention_number');

            $currentNum = ($maxAttention ? (int) $maxAttention : 0) + 1;

            foreach ($pendingReturns as $mov) {
                DB::table('inventory_movements')
                    ->where('id', $mov->id)
                    ->update(['attention_number' => $currentNum++]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
