<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liquid_refills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->decimal('level_before', 10, 2);
            $table->decimal('level_after', 10, 2);
            $table->decimal('weight_before', 10, 2);
            $table->decimal('weight_after', 10, 2);
            $table->decimal('ticket_amount', 10, 2)->nullable();
            $table->string('reference_document', 100)->nullable(); // Ej: Guía de Remisión
            $table->foreignId('user_id')->constrained('users');
            $table->timestamp('refilled_at');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liquid_refills');
    }
};
