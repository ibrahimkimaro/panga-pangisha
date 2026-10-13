<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('profile_image')->nullable();
            $t->text('bio')->nullable();
            $t->string('location')->nullable();
            $t->timestamps();
        });

        Schema::create('houses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $t->string('property_name')->nullable();
            $t->string('property_type')->nullable()->index();
            $t->string('property_category')->nullable();
            $t->string('furnishing_status')->nullable();
            $t->text('description')->nullable();
            $t->string('region')->nullable();
            $t->string('district')->nullable()->index();
            $t->string('ward')->nullable();
            $t->string('street')->nullable();
            $t->string('house_number')->nullable();
            $t->string('landmark')->nullable();
            $t->unsignedInteger('bedrooms')->nullable();
            $t->unsignedInteger('bathrooms')->nullable();
            $t->unsignedInteger('square_feet')->nullable();
            $t->decimal('monthly_rent', 12, 2)->nullable();
            $t->decimal('security_deposit', 12, 2)->nullable();
            $t->decimal('maintenance_fee', 12, 2)->nullable();
            $t->json('amenities')->nullable();
            $t->string('contact_name')->nullable();
            $t->string('contact_phone')->nullable();
            $t->string('contact_email')->nullable();
            $t->string('lease_duration')->nullable();
            $t->string('cover_image')->nullable();
            $t->string('status')->default('available')->index(); // available|rented|reserved|maintenance
            $t->decimal('latitude', 9, 6)->nullable();
            $t->decimal('longitude', 9, 6)->nullable();
            $t->timestamps();
        });

        Schema::create('units', function (Blueprint $t) {
            $t->id();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->string('unit_number');
            $t->string('status')->default('available');
            $t->decimal('monthly_rent', 12, 2)->nullable();
            $t->timestamps();
            $t->unique(['house_id', 'unit_number']);
        });

        Schema::create('house_images', function (Blueprint $t) {
            $t->id();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->string('path');
            $t->string('caption')->nullable();
            $t->timestamps();
        });

        Schema::create('device_tokens', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('token')->unique(); // FCM registration token
            $t->string('platform')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['device_tokens', 'house_images', 'units', 'houses', 'profiles'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
