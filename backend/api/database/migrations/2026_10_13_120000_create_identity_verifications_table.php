<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A landlord proves who they are with a NIDA number or a photo of the card; an admin approves or rejects it. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('identity_verifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('method');                      // nida_number | nida_card
            $t->text('nida_number')->nullable();       // encrypted at rest
            $t->string('document_path')->nullable();   // on the private disk, never under /storage
            $t->string('status')->default('pending')->index(); // pending | approved | rejected
            $t->string('rejection_reason', 500)->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestampTz('reviewed_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('identity_verifications');
    }
};
