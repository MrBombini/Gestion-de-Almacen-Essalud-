<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('hospitalization_readings')) {
            Schema::create('hospitalization_readings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cylinder_id')->constrained('cylinders');
                $table->foreignId('service_id')->nullable()->constrained('services');
                $table->foreignId('bed_id')->nullable()->constrained('beds');
                $table->foreignId('user_id')->constrained('users');
                $table->string('shift', 20);           // Morning, Afternoon, Night
                $table->decimal('pressure_psi', 8, 2); // Presión en PSI
                $table->decimal('flow_lmin', 6, 2);    // Flujo en L/min
                $table->decimal('estimated_hours', 6, 2)->nullable(); // Tiempo calculado en horas
                $table->text('notes')->nullable();
                $table->timestamp('read_at');           // Cuándo se tomó la lectura
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('hospitalization_readings');
    }
};
