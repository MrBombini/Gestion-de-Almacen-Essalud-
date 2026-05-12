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
            $table->string('type', 50); // Exchange, Decanting, SupplierEntry
            $table->string('shift', 20); // Morning, Afternoon, Night
            $table->string('reference_document', 100)->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->foreignId('patient_id')->nullable()->constrained('patients');
            $table->foreignId('service_id')->nullable()->constrained('services');
            $table->foreignId('bed_id')->nullable()->constrained('beds');
            $table->foreignId('prescription_id')->nullable()->constrained('prescriptions');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamp('movement_at');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
