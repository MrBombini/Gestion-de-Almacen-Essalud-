<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('decantings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cylinder_id')->constrained('cylinders');
            $table->foreignId('service_id')->nullable()->constrained('services');
            $table->foreignId('patient_id')->nullable()->constrained('patients');
            $table->foreignId('prescription_id')->nullable()->constrained('prescriptions');
            $table->string('manual_destination', 150)->nullable();
            $table->decimal('refilled_amount', 10, 2);
            $table->string('shift', 20); // Morning, Afternoon, Night
            $table->foreignId('user_id')->constrained('users');
            $table->timestamp('decanted_at');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('decantings');
    }
};
