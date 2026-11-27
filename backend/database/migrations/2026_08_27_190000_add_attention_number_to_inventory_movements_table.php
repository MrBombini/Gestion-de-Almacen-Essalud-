<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->unsignedBigInteger('attention_number')->nullable()->after('type')->index();
        });

        // Población segura y retroactiva de números correlativos para atenciones de PADOMI existentes
        $padomiMovements = DB::table('inventory_movements')
            ->where('type', 'Exchange')
            ->whereNotNull('patient_id')
            ->whereNull('deleted_at')
            ->orderBy('movement_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $count = 1;
        foreach ($padomiMovements as $mov) {
            DB::table('inventory_movements')
                ->where('id', $mov->id)
                ->update(['attention_number' => $count++]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropColumn('attention_number');
        });
    }
};
