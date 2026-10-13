<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->string('unit_type', 100)->nullable()->after('unit_number');
            $table->string('payment_terms', 100)->nullable()->after('monthly_rent');
            $table->unsignedInteger('bedrooms')->default(1)->after('payment_terms');
            $table->unsignedInteger('bathrooms')->default(1)->after('bedrooms');
            $table->string('image_path')->nullable()->after('bathrooms');
            $table->text('description')->nullable()->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn(['unit_type', 'payment_terms', 'bedrooms', 'bathrooms', 'image_path', 'description']);
        });
    }
};
