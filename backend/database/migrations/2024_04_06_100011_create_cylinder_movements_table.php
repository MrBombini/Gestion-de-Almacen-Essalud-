<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cylinder_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_movement_id')->constrained('inventory_movements')->onDelete('cascade');
            $table->foreignId('cylinder_id')->constrained('cylinders');
            $table->string('action', 20); // Entry, Exit
            $table->string('cylinder_status', 20); // Full, Empty
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cylinder_movements');
    }
};
