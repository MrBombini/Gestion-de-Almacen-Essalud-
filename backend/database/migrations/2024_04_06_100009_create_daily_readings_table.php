<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_readings', function (Blueprint $table) {
            $table->id();
            $table->date('reading_date');
            $table->string('shift', 20); // Morning, Afternoon, Night
            $table->decimal('ext_tank_reserve', 10, 2);
            $table->decimal('int_warehouse_consumption', 10, 2);
            $table->decimal('calculated_consumption', 10, 2);
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_readings');
    }
};
