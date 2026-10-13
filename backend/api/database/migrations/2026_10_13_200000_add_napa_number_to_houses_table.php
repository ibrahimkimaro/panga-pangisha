<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('houses', function (Blueprint $table) {
            $table->string('napa_number', 50)->nullable()->after('house_number');
        });
    }

    public function down(): void
    {
        Schema::table('houses', function (Blueprint $table) {
            $table->dropColumn('napa_number');
        });
    }
};
