<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('houses', function (Blueprint $t) {
            $t->string('advertiser_role')->default('owner'); // owner | representative
            $t->timestampTz('verified_at')->nullable();      // when ownership/authority was checked
            $t->timestampTz('availability_confirmed_at')->nullable();
        });

        Schema::create('favorites', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->timestamps();
            $t->primary(['user_id', 'house_id']);
        });

        Schema::create('viewing_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->timestampTz('preferred_at');
            $t->string('note', 500)->nullable();
            $t->string('status')->default('pending'); // pending | accepted | declined | cancelled
            $t->timestamps();
        });

        Schema::create('listing_reports', function (Blueprint $t) {
            $t->id();
            $t->foreignId('house_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('reason');
            $t->string('details', 1000)->nullable();
            $t->string('status')->default('open');
            $t->timestamps();
        });

        // Laravel owns who may talk to whom; Phoenix only delivers.
        Schema::create('conversations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_low_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('user_high_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('house_id')->nullable()->constrained()->nullOnDelete();
            $t->timestamps();
            $t->unique(['user_low_id', 'user_high_id']);
        });
    }

    public function down(): void
    {
        foreach (['conversations', 'listing_reports', 'viewing_requests', 'favorites'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('houses', fn (Blueprint $t) => $t->dropColumn(['advertiser_role', 'verified_at', 'availability_confirmed_at']));
    }
};
