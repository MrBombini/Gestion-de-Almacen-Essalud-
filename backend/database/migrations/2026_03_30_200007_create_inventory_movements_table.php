<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();

            // Quién hizo el movimiento
            $table->foreignId('user_id')->constrained('users');

            // Qué balón se movió
            $table->string('cylinder_barcode', 50);
            $table->foreign('cylinder_barcode')->references('barcode')->on('cylinders');

            // Tipo de Movimiento (Kardex EsSalud)
            $table->enum('type', [
                'Entry from Provider',   // Llega balón lleno de Linde/Praxair
                'Exit to Provider',      // Sale a recarga externa
                'Hospital Exchange',     // Lleno por Vacío en cama/Manifold
                'Trasiego/Refill',       // Balón grande llena balón pequeño
                'Patient Delivery',      // Despacho a PADOMI
                'Patient Return',        // Paciente devuelve balón
            ]);

            // FK explícitas con CONSTRAINT nombrado (cumple el requisito de integridad)
            $table->unsignedBigInteger('location_from_id')->nullable();
            $table->foreign('location_from_id', 'mov_from_location_fk')
                  ->references('id')->on('locations')->nullOnDelete();

            $table->unsignedBigInteger('location_to_id')->nullable();
            $table->foreign('location_to_id', 'mov_to_location_fk')
                  ->references('id')->on('locations')->nullOnDelete();

            // Datos DIGEMID (solo para recargas)
            $table->string('batch_number', 100)->nullable();
            $table->date('gas_expiration_date')->nullable();
            $table->decimal('quantity_loaded', 10, 2)->nullable();

            $table->text('notes')->nullable();

            // Agrupa múltiples balones de la misma operación (ej: 5 balones en un despacho)
            $table->uuid('transaction_group_id')->nullable()->index();

            $table->timestamp('movement_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
