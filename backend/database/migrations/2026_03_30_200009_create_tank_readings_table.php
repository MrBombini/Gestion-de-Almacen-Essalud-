<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tank_readings', function (Blueprint $table) {
            $table->id();

            $table->string('tank_name', 100)->default('Tanque Principal');
            $table->decimal('level_percentage', 5, 2)->nullable(); // % del medidor LCD
            $table->decimal('pressure_psi', 8, 2)->nullable();
            $table->decimal('current_m3', 10, 2);                  // m3 actuales en el tanque

            // Quién registró la lectura
            $table->foreignId('user_id')->constrained('users');

            // Si fue recarga de cisterna: marcar y cuánto ingresó
            $table->boolean('is_refill')->default(false);
            $table->decimal('quantity_added', 10, 2)->nullable();   // m3 añadidos por cisterna

            $table->enum('shift', ['Mañana', 'Tarde', 'Noche']);

            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tank_readings');
    }
};
