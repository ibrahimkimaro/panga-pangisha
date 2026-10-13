<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A user's business details (name, TIN, BRELA...), checked by an admin before they count as verified. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete(); // one business per account
            $t->string('entity_name');
            $t->string('business_type', 60);
            $t->string('tin', 9);                 // Tanzanian TIN: nine digits
            $t->string('brela', 50)->nullable();  // company registration number
            $t->string('vrn', 50)->nullable();    // VAT registration, optional
            $t->string('phone', 30)->nullable();
            $t->string('email')->nullable();
            $t->string('address')->nullable();
            $t->string('website')->nullable();
            $t->text('bio')->nullable();
            $t->string('status')->default('pending')->index(); // pending | approved | rejected
            $t->string('rejection_reason', 500)->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestampTz('reviewed_at')->nullable();
            $t->timestampTz('submitted_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_profiles');
    }
};
