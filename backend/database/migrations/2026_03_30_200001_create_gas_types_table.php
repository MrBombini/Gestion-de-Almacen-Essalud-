<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gas_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Oxígeno Medicinal, Nitrógeno, etc.
            $table->string('unit'); // m3, kg
            $table->decimal('min_stock', 10, 2)->default(10.00); // Para alertas
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gas_types');
    }
};
