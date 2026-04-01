<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cylinders', function (Blueprint $table) {
            $table->string('barcode', 50)->primary();           // PK: Código de barras físico
            $table->string('serial_number_stamped', 100)->nullable(); // Nro grabado en el cuerpo

            // Relaciones normalizadas (FKs a tablas maestras)
            $table->foreignId('gas_type_id')->constrained('gas_types');
            $table->foreignId('capacity_id')->constrained('cylinder_capacities');
            $table->foreignId('provider_id')->constrained('providers'); // Dueño legal
            $table->foreignId('cylinder_model_id')->nullable()->constrained('cylinder_models'); // Marca: JD, KIOSHI...

            $table->enum('asset_type', ['Cylinder', 'Vat/Thermos'])->default('Cylinder');

            // Control PH — Prueba Hidrostática (obligatorio DIGEMID)
            $table->date('ph_test_date')->nullable();

            // Estado ACTUAL del balón (el historial va en cylinder_status_logs)
            $table->enum('status', [
                'Full',
                'Empty',
                'In Maintenance',
                'Damaged',
                'Retired'
            ])->default('Empty');

            $table->unsignedBigInteger('current_location_id')->nullable();
            $table->foreign('current_location_id')->references('id')->on('locations');

            $table->timestamps();
            $table->softDeletes(); // Dado de baja → deleted_at, historial intacto
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cylinders');
    }
};
