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
        Schema::create('compounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('compound_type')->default('residential'); // residential, commercial, mixed
            $table->string('region')->nullable();
            $table->string('district')->nullable();
            $table->string('ward')->nullable();
            $table->string('street')->nullable();
            $table->string('house_number')->nullable();
            $table->string('napa_number')->nullable();
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->text('description')->nullable();
            $table->json('amenities')->nullable();
            $table->string('cover_image')->nullable();
            $table->json('images')->nullable();
            $table->json('documents')->nullable();
            $table->string('status')->default('active'); // active, unverified, archived
            $table->timestamps();
        });

        Schema::table('houses', function (Blueprint $table) {
            $table->foreignId('compound_id')->nullable()->after('owner_id')->constrained('compounds')->nullOnDelete();
            $table->string('rental_mode')->default('entire')->after('property_type'); // entire, rooms, apartments, commercial
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('houses', function (Blueprint $table) {
            $table->dropForeign(['compound_id']);
            $table->dropColumn(['compound_id', 'rental_mode']);
        });

        Schema::dropIfExists('compounds');
    }
};

