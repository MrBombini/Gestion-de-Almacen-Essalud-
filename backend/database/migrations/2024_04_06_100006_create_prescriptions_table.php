<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained('services');
            $table->string('dosage', 50)->nullable();          // Ej: 2 litros / min
            $table->string('usage_time', 50)->nullable();     // Ej: 15 horas al día
            $table->date('issued_at')->nullable();
            $table->date('expires_at');
            $table->date('authorization_date')->nullable();
            $table->string('promissory_note', 100)->nullable();
            $table->string('status', 20)->default('active'); // active, expired, canceled
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
