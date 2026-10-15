<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_drafts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('revision')->default(1);
            $table->json('data');
            $table->json('validation_state')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->foreignId('created_house_id')->nullable()->constrained('houses')->nullOnDelete();
            $table->string('status', 30)->default('draft')->index();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_drafts');
    }
};
