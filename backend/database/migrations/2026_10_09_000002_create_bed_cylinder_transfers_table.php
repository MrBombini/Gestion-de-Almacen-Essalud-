<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('bed_cylinder_transfers')) {
            Schema::create('bed_cylinder_transfers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cylinder_id')->constrained('cylinders');
                $table->foreignId('from_bed_id')->nullable()->constrained('beds');
                $table->foreignId('to_bed_id')->constrained('beds');
                $table->foreignId('from_service_id')->nullable()->constrained('services');
                $table->foreignId('to_service_id')->nullable()->constrained('services');
                $table->foreignId('user_id')->constrained('users');
                $table->string('shift', 20);
                $table->text('notes')->nullable();
                $table->timestamp('transferred_at');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bed_cylinder_transfers');
    }
};
