<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cylinders', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 50)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->foreignId('ownership_type_id')->constrained('ownership_types');
            $table->foreignId('patient_id')->nullable()->constrained('patients');
            $table->foreignId('service_id')->nullable()->constrained('services');
            $table->foreignId('current_patient_id')->nullable()->constrained('patients');
            $table->foreignId('current_service_id')->nullable()->constrained('services');
            $table->foreignId('current_bed_id')->nullable()->constrained('beds');
            $table->string('gas_type', 50); // Oxygen, Nitrogen, etc.
            $table->decimal('capacity', 10, 2); // 1m3, 3.45m3, 6m3, 10m3
            $table->string('status', 30)->default('full'); // full, empty, in_use, lost
            $table->date('hydrostatic_test_date')->nullable();
            $table->string('physical_condition', 50)->default('Good');
            $table->string('location', 50)->default('CENTRAL'); // CENTRAL, HOSPITALIZACION, PADOMI, ALMACEN, PROVEEDOR
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cylinders');
    }
};
