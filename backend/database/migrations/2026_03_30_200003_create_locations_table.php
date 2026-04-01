<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('service_name'); // Ej: Oncología, Juan Pérez
            $table->string('identifier');   // Ej: 102, 2330
            $table->string('short_code')->unique(); // Ej: onco102
            $table->enum('type', ['Hospital', 'Warehouse', 'Provider', 'Patient']);
            $table->timestamps();
            $table->softDeletes(); // Cama/Servicio dado de baja, historial intacto
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
